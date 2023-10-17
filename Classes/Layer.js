import StrokeStack from "./StrokeStack.js";
import DisplayMap from "./DisplayMap.js";

export default class Layer{
    #maxTriangles;

    
    #strokeStack;
    #undoneStack;

    #displayMap;

    #stroking;
    #visible;

    constructor(maxTriangles, displayMap={}, visible=true){
        /*
        this.#rowCount = rowCount;
        this.#columnCount = columnCount;
        */
        this.#maxTriangles = maxTriangles;

        this.#strokeStack = new StrokeStack();
        this.#undoneStack = new StrokeStack();
        this.#displayMap = new DisplayMap(displayMap);

        this.#stroking = false;
        this.#visible = visible;
    }

    //mysterious... seems like we never use this function
    addTriangle(triangleIndex, currentTool){
        this.#strokeStack.addTriangle(triangleIndex, currentTool);
    }

    undoStroke(){
        if (this.#strokeStack.getSize() !== 0){
            let undoneStroke = this.#strokeStack.popStroke();

            this.#undoneStack.pushStroke(undoneStroke);

            this.#displayMap.undoStroke(undoneStroke);

            return true;
        }
        return false;
    }

    redoStroke(){
        if (this.#undoneStack.getSize() !== 0){
            let redoneStroke = this.#undoneStack.popStroke();
            this.#strokeStack.pushStroke(redoneStroke);

            this.#displayMap.redoStroke(redoneStroke);
            return true;
        }
        return false;
    }

    isVisible(){
        return this.#visible;
    }

    getDisplayMap(){
        return this.#displayMap;
    }

    startStroke(index, currentColor){
        this.#strokeStack.startStroke();
        this.#undoneStack = new StrokeStack();
        return this.continueStroke(index, currentColor)
    }
    
    continueStroke(index, currentColor){
        let vector = this.#getVector(index, currentColor);        
        this.#strokeStack.addToStroke(index, vector);
        return this.#displayMap.setColor(index, currentColor);
    }
    
    toggleVisibility(){
        this.#visible = !this.#visible;
        return this.#visible;
    }

    #getVector(index, currentColor){
        return [this.#displayMap.getColorAt(index), currentColor]
    }

    getSerializedDisplayMap(){
        return this.getDisplayMap().getSerializedDisplayMap();
    }
}