/*
Controller cares only about the grid and layers. It does not operate on canvas coordinates, but in index coordinates.
*/
import DisplayMap from "../Classes/DisplayMap.js";
import Layer from "../Classes/Layer.js"
import Tool from "../Tools/Tool.js";

export default class LogicalCanvas{
    #rowCount;
    #columnCount;
    #maxTriangles

    //Layer
    #layerArray;
    #activeLayerIndex;
    #layerCount

    //Copy-Paste Layer
    #tempLayer
    #tempLayerIsActive

    //Tool
    #currentTool;

    #currentColor;

    //! NOT VERY CLEAN
    #customColor;
    #usingCustomColor;

    #physicalCanvas;

    constructor(rowCount, columnCount, LAYER_COUNT, physicalCanvas){
        this.#physicalCanvas = physicalCanvas;
        this.stroking = false;
        
        //! bad code? we are mixing in lower level details
        //Brush tool should keep track of currently selected color anyways, not LogicalCanvas
        this.#usingCustomColor = false;
        this.#customColor = [0, 0, 0, 0];
        this.#currentColor = [0.0, 0.0, 0.0, 1.0];

        this.#rowCount = rowCount;
        this.#columnCount = columnCount;
        this.#maxTriangles = rowCount*columnCount*4;

        // LAYERS
        this.#layerArray = [];
        this.#activeLayerIndex = 0;
        this.#layerCount = LAYER_COUNT;
        
        //Layer initialization
        for (let i = 0; i < this.#layerCount; i++){
            this.#layerArray.push(new Layer(this.#maxTriangles));
        }

        //Tool
        this.#currentTool = new Tool(this, physicalCanvas, "cursor");

        //Temp Layer
        this.#tempLayerIsActive = false;

    }




    //Shift
//Shift every element within rectangle by x and y 
                                                                      //Shift by x <=> += x*4
                                                                      //Shift by y <=> += y*COLUMNS*4
                                                                      //First calculate x-shift. If, when x-shifted, the element is shifted onto a new row, remove that element
                                                                      //Then calculate y-shift. Check whether i > ROW*COLUMN*4(max index)
                                                                      //Add stroke
    shift(trianglesWithinRectangle, x, y){
        let activeLayer = this.getActiveLayer();

        let started = false;
        for(const [key, value] of Object.entries(trianglesWithinRectangle.getDisplayMap())){
            //For each element, first remove it from canvas:
            if (!started){
                activeLayer.startStroke(key, null);
                started = true;
            }
            else{
                activeLayer.continueStroke(key, null);
            }
        }

        let newTrianglesWithinRectangle = new DisplayMap();
        //Now, change newTrianglesWithinRectangle
        for (const [key, value] of Object.entries(trianglesWithinRectangle.getDisplayMap())){
            let curRow = Math.ceil(key / (this.#columnCount * 4));
            let newIndex = parseInt(key) + x*4;
            let newRow = Math.ceil(newIndex / (this.#columnCount * 4));

            if (newRow != curRow){ //shifted outside the screen, don't add to new view
                continue;
            }

            newIndex += y*this.#columnCount*4;
            if (newIndex > this.#maxTriangles){ //shifted outside the screen, don't add to new view
                continue
            }

            //Inside the screen, so add to new view
            newTrianglesWithinRectangle.setColor(newIndex, value);
        }

        for (const [key, value] of Object.entries(trianglesWithinRectangle.getDisplayMap())){
            //Now delete
            trianglesWithinRectangle.setColor(key, null);//delete, since this is going to be shifted
        }
        
        started = false;
        //Change trianglesWithinRectangle and the displayMap
        for (const [key, value] of Object.entries(newTrianglesWithinRectangle.getDisplayMap())){
            trianglesWithinRectangle.setColor(key, value);

            //and canvas
            if (!started){
                activeLayer.startStroke(key, value);
                started = true;
            }
            else{
                activeLayer.continueStroke(key, value);
            }
        }
    }

    //TODO: copy-paste functions(tempLayer is where the copied rectangle is kept)
    getTemporaryLayer(){
        return this.hasTemporaryLayer() ? this.#tempLayer : null;
    }
    hasTemporaryLayer(){
        return this.#tempLayerIsActive;
    }
    activateTempLayer(){
        this.#tempLayerIsActive = true;
    }
    deactivateTempLayer(){
        this.#tempLayerIsActive = false;
    }
    setTempLayer(rectangle){
        this.#tempLayer = new Layer(rectangle.getDisplayMap())
    }



    //When a rectangle has been copied you can either 1)drag it 
    // 2) paste it 
    copyRectangle(){
        return this.#currentTool.copyRectangle();
    }
    pasteRectangle(){
        return this.#currentTool.pasteRectangle();
    }

    //!ANYTHING BELOW DOESN'T REQUIRE ANY FURTHER TINKERING AT THE MOMENT

    //Layer reordering
    shiftLayerDown(i){
        let temp = this.#layerArray[i];
        this.#layerArray[i] = this.#layerArray[i+1];
        this.#layerArray[i+1] = temp;

        if (this.#activeLayerIndex == i){
            this.#activeLayerIndex = i + 1//since they got exchanged 
        }
        else if (this.#activeLayerIndex == i+1){
            this.#activeLayerIndex = i
        }
    }
    shiftLayerUp(i){
        let temp = this.#layerArray[i];
        this.#layerArray[i] = this.#layerArray[i-1];
        this.#layerArray[i-1] = temp;

        if (this.#activeLayerIndex == i){
            this.#activeLayerIndex = i - 1//since they got exchanged 
        }
        else if (this.#activeLayerIndex == i-1){
            this.#activeLayerIndex = i
        }
    }

    //Panning/Zooming
    #zoomFactor = 1;
    canPan(){
        return this.getZoomFactor() > 1; 
    }
    zoomIn(){
        this.#zoomFactor *= 2;
    }
    zoomOut(){
        this.#zoomFactor /= 2;
    }
    getZoomFactor(){
        return this.#zoomFactor;
    }

    //Save/Load fcn
    getState(){
        let stateArr = [];
        stateArr.push(this.#rowCount + "," + this.#columnCount); //row,column
        stateArr.push(this.#layerCount.toString()); //number of layers
        
        for (let i = 0; i < this.#layerCount; i++){
            stateArr.push(this.#layerArray[i].getSerializedDisplayMap());
        }

        /* Forget about current tools and stuff for now
        stateArr.push(this.#activeLayerIndex.toString()); //active layer index
        
        stateArr.push(this.#currentTool.getName()); //tool
        
        stateArr.push(JSON.stringify(this.#currentColor)); //color
        stateArr.push(JSON.stringify(this.#customColor));
        stateArr.push(this.#usingCustomColor.toString());
        */
        return stateArr;
    }
    setStrArrState(stateArr){

        const [rowCount, columnCount] = (stateArr.shift()).split(",").map((str) => parseInt(str));

        const layerCount = parseInt(stateArr.shift());
        const mapOfLayers = []

        for (let i = 0; i < layerCount; i++){
            let curMap = stateArr.shift();
            curMap = JSON.parse(curMap);
            mapOfLayers.push(curMap);
        }

        /*
        const activeLayerIndex = parseInt(stateArr.shift());
        const currentToolName = stateArr.shift();

        const currentColor = JSON.parse(stateArr.shift());
        const customColor = JSON.parse(stateArr.shift());
        const usingCustomColor = JSON.parse(stateArr.shift());
        */

        this.setArrState(rowCount, columnCount, layerCount, mapOfLayers);//, activeLayerIndex, currentToolName, currentColor, customColor, usingCustomColor);
    }
    //!For cleaner code make sure this works and call it in the constructor
    //!For more modular code mapOfLayers shouldn't have three empty objects by default, since there can be an arbitrary number of layers in a different iteration of the program
    setArrState(rowCount, columnCount, layerCount=3, mapOfLayers=[{},{},{}], activeLayerIndex=0, currentToolName="cursor", currentColor=[0.0, 0.0, 0.0, 1.0], customColor=[0,0,0,0], usingCustomColor=false){
        this.stroking = false; //false by default: cannot load a file and be stroking immediately

        this.#rowCount = rowCount;
        this.#columnCount = columnCount;
        this.#maxTriangles = rowCount*columnCount*4;

        this.#usingCustomColor = usingCustomColor;
        this.#customColor = customColor;
        this.#currentColor = currentColor;

        // LAYERS
        this.#layerCount = layerCount;
        this.#layerArray = [];
        this.#activeLayerIndex = activeLayerIndex;
        
        for (let i = 0; i < this.#layerCount; i++){
            this.#layerArray.push(new Layer(this.#maxTriangles, mapOfLayers[i]))
        }

        this.#currentTool = new Tool(this, this.#physicalCanvas ,currentToolName);

        this.#tempLayerIsActive = false;
    }

    //anything else?
    switchTools(newTool){
        return this.#currentTool.switchTools(newTool);
    }

    //Returns whether it is on or off now
    toggleVisibility(index){
        return this.#layerArray[index].toggleVisibility();
    }

    switchToColor(newColor){
        this.#currentColor = [...newColor];
    }

    setCustomColor(attribute, newValue){
        this.#customColor[attribute] = newValue;
    }
    getCustomColor(){
        return this.#customColor;
    }
    
    //switch from / to custom color
    toggleCustomColor(){
        this.#usingCustomColor = !this.#usingCustomColor;
    }

    isUsingCustomColor(){
        return this.#usingCustomColor;
    }

    getCurrentColor(){
        return this.isUsingCustomColor() ? [...this.#customColor] : [...this.#currentColor];
    }

    hasVisibleLayers(){    
        for (let i = 0; i < this.#layerCount; i++){
            if (this.#layerArray[i].isVisible()){
                return true;
            }
        }    
        return false;  
    }

    getVisibleLayers(){  
        let layers = [];

        for (let i = 0; i < this.#layerCount; i++){
            if (this.#layerArray[i].isVisible()){
                layers.push(this.#layerArray[i].getDisplayMap());
            }
        }  
        
        return layers;
    }

    mousedownHandler(index, canvasCoords){
        return this.#currentTool.mousedownHandler(index, canvasCoords);
    }
    mousemoveHandler(index, canvasCoords){
        return this.#currentTool.mousemoveHandler(index, canvasCoords);
    }
    mouseupHandler(index, canvasCoords){
        return this.#currentTool.mouseupHandler(index, canvasCoords);
    }

    //Tool independent
    undoStroke(){
        if (!this.stroking && this.hasActiveLayer() ){
            return this.getActiveLayer().undoStroke();
        }
        return false;
    }
    redoStroke(){
        if (!this.stroking && this.hasActiveLayer()){
            return this.getActiveLayer().redoStroke();
        }
        return false;
    } 

    changeActiveLayer(i){
        let formerActiveLayer = this.#activeLayerIndex;

        if (i == this.#activeLayerIndex){
            this.disableActiveLayer();
        }
        else{
            this.setActiveLayer(i);
        }

        return [formerActiveLayer, this.#activeLayerIndex];
    }
    disableActiveLayer(){
        this.setActiveLayer(-1);
    }
    setActiveLayer(i){
        this.#activeLayerIndex = i;
    }
    hasActiveLayer(){
        return this.#activeLayerIndex !== -1
    }
    getActiveLayer(){
        if (this.hasActiveLayer()){
            return this.#layerArray[this.#activeLayerIndex];
        }
        return null;
    }
}

