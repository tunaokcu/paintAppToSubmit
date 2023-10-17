import PhysicalCanvas from "../Components/PhysicalCanvas.js";
import {Cursor, Brush, Eraser, Select} from "./ToolStates.js";
import ToolState from "./ToolState.js";

//import LogicalCanvas from "../Components/LogicalCanvas";
//! Idea: maybe the tool should accumulate the current stroke and push it to stroke stack
export default class Tool{
    /*
    cursor = new ToolState();

    brush = new ToolState(); // brush start, brush continue, brush end
    eraser = new ToolState(); // erase start, erase continue, erase end
    
    select = new ToolState(); // select start, select continue, select idle, select end
    copy = new ToolState(); // copy -> select start
    drag = new ToolState(); // drag start, drag continue, select idle

    currentState = new ToolState(); // actual state

    constructor(){
        cursor = new Cursor(this);
        brush = new Brush(this);
        eraser = new Eraser(this);
        select = new Select(this);
        copy = new Copy(this);
        drag = new Drag(this);

        currentState = cursor;
    }*/

    //ToolState
    #currentState;
    #logicalCanvas;
    
    #CURSOR;
    #BRUSH;
    #ERASER;
    #SELECT;

    //Start state will be set to cursor
    constructor(logicalCanvas, physicalCanvas, initialTool){
        this.#logicalCanvas = logicalCanvas;

        this.#CURSOR = new Cursor(logicalCanvas);
        this.#BRUSH = new Brush(logicalCanvas);
        this.#ERASER = new Eraser(logicalCanvas);
        this.#SELECT = new Select(logicalCanvas, physicalCanvas);

        this.#currentState = new ToolState();//dummy var
        this.switchTools(initialTool);
    }   

    mousedownHandler(index, canvasCoords){
        this.#startNewOperation(); //won't work for cursor
        return this.#currentState.mousedownHandler(index, canvasCoords);
    }
    mousemoveHandler(index, canvasCoords){
        if (!this.#logicalCanvas.stroking){ return false; }
        return this.#currentState.mousemoveHandler(index, canvasCoords);
    }
    mouseupHandler(index, canvasCoords){
        this.#endOngoingOperation();
        return this.#currentState.mouseupHandler(index, canvasCoords);
    }
    
    //State switch functions
    switchTools(toolString){
        switch (toolString){
            case "cursor":
                return this.setCursor();
                break;
            case "brush":
                return this.setBrush();
                break;
            case "eraser":
                return this.setEraser();
                break;
            case "select":
                this.setSelect();
                break;
        }  
        //Nothing new to render
        return false;
    }

    setCursor(){
        let changesMade = this.#transitionToNewState();
        this.#currentState = this.#CURSOR;
        return changesMade;
    }
    setBrush(){
        let changesMade = this.#transitionToNewState();
        this.#currentState = this.#BRUSH;
        return changesMade;
    }
    setEraser(){
        let changesMade = this.#transitionToNewState();
        this.#currentState = this.#ERASER;
        return changesMade;
    }
    setSelect(){
        this.#transitionToNewState();
        this.#currentState = this.#SELECT;
    }

    //Handles state transition(nothing is left incomplete: we aren't still stroking, etc)
    #transitionToNewState(){
        this.#endOngoingOperation();
        return this.#currentState.reset();
    }

    //Operation = stroke
    #startNewOperation(){
        this.#logicalCanvas.stroking = true;
    }
    #endOngoingOperation(){
        this.#logicalCanvas.stroking = false;
    }
    /*
    handle(eventType, index){
        
    }
    */
   
    getName(){
        return this.#currentState.getName();
    }


    copyRectangle(){
        if (this.getName() === "select"){
            return this.#currentState.copyRectangle();
        }
        else{
            return false;
        }
    }
    pasteRectangle(){
        if (this.getName() === "select"){
            return this.#currentState.pasteRectangle();
        }
        else{
            return false;
        }
    }
}