import SaveLoadHandler from "./SaveLoadHandler.js";
import handleDisplayChange from "./handleDisplayChange.js";

export default class UserInterface{
    #logicalCanvas;
    #physicalCanvas;
    #SAVE_LOAD;

    constructor(logicalCanvas, physicalCanvas){
        this.#logicalCanvas = logicalCanvas;
        this.#physicalCanvas = physicalCanvas;

        this.#instantiateColorSelect();
        this.#instantiateColorSliders();
        this.#instantiateToolSelect();
        this.#instantiateLayerTable();

        this.#instantiateSaveLoad();
    }

    //Color Select
    #instantiateColorSelect(){
        let colorButtons = [...document.getElementById("ColorSelect").getElementsByTagName("button")];

        colorButtons.map((button) => button.addEventListener("click", () => this.#colorSelectHandler(this.#logicalCanvas, button.value)));
    }
    #colorSelectHandler(logicalCanvas, colorArrStr){
        let colorArr = this.#arrStrToArr(colorArrStr);
        logicalCanvas.switchToColor(colorArr);
        if (logicalCanvas.isUsingCustomColor()){
            logicalCanvas.toggleCustomColor();
        }
    }
    #arrStrToArr(arrStr){
        return arrStr.split(",").map(parseFloat);
    }

    //Color Sliders
    #instantiateColorSliders(){
        let colorSliders = document.getElementById("ColorSliders");
        const [sliders, button] = [colorSliders.getElementsByTagName("input"), colorSliders.getElementsByTagName("button")];
        
        [...sliders].map((slider, index) => slider.addEventListener("input", (event) => this.#sliderHandler(this.#logicalCanvas, index, parseInt(event.target.value))))
        button[0].addEventListener("click", () => this.#customColorToggleHandler(this.#logicalCanvas));
    }
    #sliderHandler(logicalCanvas, attribute, newValue){
        logicalCanvas.setCustomColor(attribute, newValue/255);
        let button = document.getElementById("SliderOn");
        let currentColor = logicalCanvas.getCustomColor();
        let currentColorStr = "rgba(" +  Math.round(currentColor[0]*255) +"," +  Math.round(currentColor[1]*255) + "," +  Math.round(currentColor[2]*255) + "," + currentColor[3] + ")";

        button.style.backgroundColor = currentColorStr;
    }
    #customColorToggleHandler(logicalCanvas){ 
        logicalCanvas.toggleCustomColor(); 
    }

    //Tool Select
    #instantiateToolSelect(){
        var toolSelection = document.getElementById("ToolSelection");
        toolSelection.querySelector('.CursorButton').addEventListener("click", () => this.#handleToolSwitch(this.#logicalCanvas, this.#physicalCanvas, 'cursor'));
        toolSelection.querySelector('.BrushButton').addEventListener("click", () => this.#handleToolSwitch(this.#logicalCanvas, this.#physicalCanvas,'brush'));
        toolSelection.querySelector('.EraserButton').addEventListener("click", () => this.#handleToolSwitch(this.#logicalCanvas,this.#physicalCanvas, 'eraser'));
        toolSelection.querySelector('.SelectButton').addEventListener("click", () => this.#handleToolSwitch(this.#logicalCanvas,this.#physicalCanvas, 'select'));
    }
    #handleToolSwitch(logicalCanvas, physicalCanvas, newTool){
        if (logicalCanvas.switchTools(newTool)){
            handleDisplayChange(logicalCanvas, physicalCanvas);
        }
    }

    //Layer Table
    #instantiateLayerTable(){
        let layersTable = document.getElementById("Layers");

        /*
        //Note that as a result of all these selections we are left with an array of BUTTONS, not columns
        let visibilityRow = [...layersTable.querySelector(".VisibilityRow").getElementsByTagName("th")].slice(1).map((element) => element.getElementsByTagName("button")[0]);
        let lockedRow = [...layersTable.querySelector(".LockedRow").getElementsByTagName("th")].slice(1).map((element) => element.getElementsByTagName("button")[0]);
        
        visibilityRow.map((button, index) => button.addEventListener("click", () => this.#layerVisibilityToggleHandler(this.#logicalCanvas, this.#physicalCanvas, index, button)))
        lockedRow.map((button, index) => button.addEventListener("click", () => this.#activeLayerChangeHandler(this.#logicalCanvas, index, lockedRow, button)))
        */
       for (let i = 0, row; row = layersTable.rows[i]; i++){
            let columns = row.getElementsByTagName("th");
            //! These event listeners are on the cells, not the buttons
            columns[0].addEventListener("click", () => (this.#layerVisibilityToggleHandler(this.#logicalCanvas, this.#physicalCanvas, i, columns[0].getElementsByTagName("button")[0])));
            columns[1].addEventListener("click", () => (this.#activeLayerChangeHandler(this.#logicalCanvas, i)));
            
            let directionalButton = columns[2].getElementsByTagName("button")[0];
            directionalButton.addEventListener("click", (event) => (this.#upDownClickHandler(event, i, directionalButton)));
            //! Anything below this is for animations and is optional
            //directionalButton.addEventListener("mouseover", (event) => (this.#upDownHoverHandler(event, i, directionalButton)));
            directionalButton.addEventListener("mouseout", (event) => (directionalButton.className = "UpDown"));
            document.addEventListener("mousemove", (event) => this.#upDownHoverHandler(event, i, directionalButton));

        }
    }
    #layerVisibilityToggleHandler(logicalCanvas, physicalCanvas, index, button){
        let currentlyOn = logicalCanvas.toggleVisibility(index);
        this.#changeVisibilityButtonStyling(button, currentlyOn);
        handleDisplayChange(logicalCanvas, physicalCanvas);
    }
    #activeLayerChangeHandler(logicalCanvas, index){
        /*
        let toggleLater = clickedButton.textContent === "Off"; //If, before the click, this button was off then we need to change it to on now

        for (const button of allButtons){
            button.textContent = "Off";
        }

        
        if (toggleLater){
            this.#changeActiveButtonStyling(clickedButton);
        }   
        */

        let [formerActiveLayer, currentlyActiveLayer] = logicalCanvas.changeActiveLayer(index);
        //1. deactivate formerActiveLayer
        let formerlyActiveButtonName = "LayerUnlocked" + formerActiveLayer;
        if (formerActiveLayer != -1){
            let formerlyActiveButton = document.getElementsByClassName(formerlyActiveButtonName)[0];

            formerlyActiveButton.classList.replace("Unlocked", "Locked");
        }
        //2. activate currentlyActiveLayer if it isn't -1
        let currentlyActiveButtonname = "LayerUnlocked" + currentlyActiveLayer;
        if (currentlyActiveLayer != -1){//Now the clicked button is active
            let currentlyActiveButton = document.getElementsByClassName(currentlyActiveButtonname)[0];

            currentlyActiveButton.classList.replace("Locked", "Unlocked");
        }
    }
    #changeVisibilityButtonStyling(button, currentlyOn){
        if (currentlyOn){//Was off before, so
            button.classList.replace("VisibilityOff", "VisibilityOn");
        }
        else{
            button.classList.replace( "VisibilityOn","VisibilityOff");
        }
    }

    #upDownHoverHandler(event, i, button){
        let orientation = this.#getCursorArea(event, button);
        
        switch (orientation){
            case "down":
                button.className = "Down";
                break;
            case "up":
                button.className = "Up";
                break;
            case "mid":
                button.className = "UpDown";
                break;
            case "outside":
                break;
        }

    }
    
    //!BAD CODE!!!! FIX LATER(FOR NOW 3 LAYERS ARE EXPECTED OF US ANYWAYS SO THIS WILL BE FINE)
    #LAYER_COUNT = 3;
    #upDownClickHandler(event, i, button){
        let orientation = this.#getCursorArea(event, button);
        switch (orientation){
            case "down":
                if (i == this.#LAYER_COUNT-1){ //Last layer cannot be shifted down
                    break;
                }

                //Exchange button info in buttons[i] with button info in buttons[i+1]
                //Then, in layers array, exchange layer[i] with layer[i+1]
                this.#logicalCanvas.shiftLayerDown(i);
                this.#swapButtonInfo(i, i+1);

                handleDisplayChange(this.#logicalCanvas, this.#physicalCanvas);
                break; 
            case "up":
                if (i == 0){ //First layer cannot be shifted up
                    break;
                }

                this.#logicalCanvas.shiftLayerUp(i);
                this.#swapButtonInfo(i, i-1);
                
                handleDisplayChange(this.#logicalCanvas, this.#physicalCanvas);
                break;
            case "mid":
                //Do nothing
                break;
            case "outside":
                //Do nothing
                break;
        }    
    }

    #swapButtonInfo(i , j){
        let layeri = document.getElementsByClassName("Layer" + i)[0];
        let layerj = document.getElementsByClassName("Layer" + j)[0];

        const [layeriVisibility, layeriUnlocked] = layeri.getElementsByTagName("button");
        const [layerjVisibility, layerjUnlocked] = layerj.getElementsByTagName("button");

        const layeriIsVisible = layeriVisibility.classList.contains("VisibilityOn");
        const layeriIsUnlocked = layeriUnlocked.classList.contains("Unlocked");

        const layerjIsVisible = layerjVisibility.classList.contains("VisibilityOn");
        const layerjIsUnlocked = layerjUnlocked.classList.contains("Unlocked");  
        
        //Remove layeri
        if (layeriIsVisible){
            layeriVisibility.classList.remove("VisibilityOn");
        }else{
            layeriVisibility.classList.emove("VisibilityOff");
        }
        if (layeriIsUnlocked){
            layeriUnlocked.classList.remove("Unlocked")
        }
        else{
            layeriUnlocked.classList.remove("Locked");
        }


        //Remove layerj
        if (layerjIsVisible){
            layerjVisibility.classList.remove("VisibilityOn");
        }else{
            layerjVisibility.classList.remove("VisibilityOff");
        }
        if (layerjIsUnlocked){
            layerjUnlocked.classList.remove("Unlocked")
        }
        else{
            layerjUnlocked.classList.remove("Locked");
        }

        //Init layeri and layerj based on each other's props
        //Init layerj
        if (layeriIsVisible){
            layerjVisibility.classList.add("VisibilityOn");
        }else{
            layerjVisibility.classList.add("VisibilityOff");
        }
        if (layeriIsUnlocked){
            layerjUnlocked.classList.add("Unlocked");
        }
        else{
            layerjUnlocked.classList.add("Locked");
        }


        //Remove layerj
        if (layerjIsVisible){
            layeriVisibility.classList.add("VisibilityOn");
        }else{
            layeriVisibility.classList.add("VisibilityOff");
        }
        if (layerjIsUnlocked){
            layeriUnlocked.classList.add("Unlocked");
        }
        else{
            layeriUnlocked.classList.add("Locked");
        }    
    }

    #getCursorArea(event, button){
        const rect = button.getBoundingClientRect();

        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom){
            return "outside"
        }
        const mouseY = event.clientY - rect.top;

        const heightOfMidArea = rect.height / 7;//Try 1/10 next

        const midPoint = rect.height / 2;
        const heightOfLowerArea = midPoint + heightOfMidArea;
        const heightOfUpperArea = midPoint - heightOfMidArea;

    

        if (mouseY  >heightOfLowerArea) {
            return "down"
        } 
        else if (mouseY < heightOfUpperArea) {
            return "up"
        }
        else if (mouseY < heightOfLowerArea && mouseY > heightOfUpperArea){
            return "mid"
        }
        else{ //!remove: unnecessary
            return "outside"
        }
    }
    
    //Save/Load
    #instantiateSaveLoad(){
        this.#SAVE_LOAD = new SaveLoadHandler();
        let saveLoad = document.getElementById("SaveLoad");
        let save = saveLoad.getElementsByTagName("button")[0];
        let loadForm = document.getElementById("LoadForm");
        console.log(loadForm)

        save.addEventListener("click", () => this.#saveHandler(this.#logicalCanvas, this.#SAVE_LOAD));
        loadForm.addEventListener("change", (event) => this.#loadHandler(this.#logicalCanvas, this.#physicalCanvas, this.#SAVE_LOAD, event, loadForm));
        document.getElementById("Load").addEventListener("submit", (e) => (e.preventDefault()));
    }

    #saveHandler(logicalCanvas, saveLoad){
        saveLoad.save(logicalCanvas, "Data.txt")
    }

    #loadHandler(logicalCanvas, physicalCanvas, saveLoad, event, loadForm){
        event.preventDefault();

        var fr = new FileReader();
        fr.onload = () => {
            saveLoad.load(logicalCanvas, physicalCanvas, fr.result);
        }

        fr.readAsText(loadForm.files[0])
    }

}