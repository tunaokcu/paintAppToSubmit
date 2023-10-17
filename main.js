import LogicalCanvas from "./Components/LogicalCanvas.js";
import PhysicalCanvas from "./Components/PhysicalCanvas.js";
import UserInterface from "./Components/UserInterface.js";

import { canvasCoordsToTriangleCode as canvasToIndex } from "./Common/triangleSystem.js";
import handleDisplayChange from "./Components/handleDisplayChange.js";

const ROW_COUNT = 30;
const COLUMN_COUNT = 30;
const LAYER_COUNT = 3;

let LOGICAL_DISPLAY, PHYSICAL_DISPLAY, USER_INTERFACE
let currentCanvasCoords;

window.onload = () => {
    currentCanvasCoords = document.getElementById( "gl-canvas" ).getBoundingClientRect();
    document.addEventListener("scroll", () => (currentCanvasCoords = document.getElementById( "gl-canvas" ).getBoundingClientRect()));



    //Will handle webgl rendering
    PHYSICAL_DISPLAY = new PhysicalCanvas(ROW_COUNT, COLUMN_COUNT, LAYER_COUNT);
    
    //Will handle grid / layer logic
    // ? Who will handle tool logic?
    LOGICAL_DISPLAY = new LogicalCanvas(ROW_COUNT, COLUMN_COUNT, LAYER_COUNT, PHYSICAL_DISPLAY);

    //Will handle HTML UI
    USER_INTERFACE = new UserInterface(LOGICAL_DISPLAY, PHYSICAL_DISPLAY);



    // Stroke: mousedown, mousemove, mouseup
    document.addEventListener("mousedown", mousedownHandler); //? should be canvas
    document.addEventListener("mousemove", mousemoveHandler); 
    document.addEventListener("mouseup", mouseupHandler); //? should be canvas

    // CTRL-Z, CTRL-Y
    document.addEventListener("keydown", ctrlzHandler);
    document.addEventListener("keydown", ctrlyHandler);

    // CTRL-C, CTRL-V
    document.addEventListener("keydown", ctrlCHandler);
    document.addEventListener("keydown", ctrlVHandler);

    //Zoom handler
    document.addEventListener("wheel", (event) => zoomHandler(event), {passive: false}); //the {passive: false} part is necessary for the zoomHandler to prevent default action
}


//let intialMeasurement = 0;
function zoomHandler(event){
    if (event.ctrlKey && event.deltaY != 0){
        event.preventDefault();

        let direction = event.deltaY < 0 ? "up" : "down";
        if (direction === "up"){
            LOGICAL_DISPLAY.zoomIn();
            console.log("zooming in; zoom factor: ", LOGICAL_DISPLAY.getZoomFactor());
        }
        else{
            LOGICAL_DISPLAY.zoomOut();
            console.log("zooming out; zoom factor: ", LOGICAL_DISPLAY.getZoomFactor());
        }
    }
}

//!Wrong to check all those things here...
function mousedownHandler(event){

    let index = clientToIndex(event);
    let canvasCoords = clientToCanvas(event);

    if (index !== null && LOGICAL_DISPLAY.hasActiveLayer()){        
        let changeOccured = LOGICAL_DISPLAY.mousedownHandler(index, canvasCoords);
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }    
    }
}
function mousemoveHandler(event){
    let index = clientToIndex(event);
    let canvasCoords = clientToCanvas(event);

    if (index !== null && LOGICAL_DISPLAY.hasActiveLayer()){
        let changeOccured = LOGICAL_DISPLAY.mousemoveHandler(index, canvasCoords);
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}
function mouseupHandler(event){
    let index = clientToIndex(event);
    let canvasCoords = clientToCanvas(event);

    if (index !== null && LOGICAL_DISPLAY.hasActiveLayer()){
        let changeOccured =  LOGICAL_DISPLAY.mouseupHandler(index, canvasCoords);
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}

function ctrlzHandler(event){
    if (  event.ctrlKey && (event.key === "z" || event.key ==="Z") ){
        let changeOccured = LOGICAL_DISPLAY.undoStroke();
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}
function ctrlyHandler(event){
    if ( event.ctrlKey && (event.key === "y" || event.key ==="Y") ){
        let changeOccured = LOGICAL_DISPLAY.redoStroke();
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}

function ctrlCHandler(event){
    if ( event.ctrlKey && (event.key ==="c" || event.key ==="C") ){
        let changeOccured = LOGICAL_DISPLAY.copyRectangle();
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}
function ctrlVHandler(event){
    if ( event.ctrlKey && (event.key ==="V" || event.key ==="V") ){
        let changeOccured = LOGICAL_DISPLAY.pasteRectangle();
        if (changeOccured){
            handleDisplayChange(LOGICAL_DISPLAY, PHYSICAL_DISPLAY)
        }
    }
}

//HELPER FUNCTIONS
function clientToIndex(event){
    let canvasCoords = clientToCanvas(event);

    if (canvasCoords === null){ return null; }
    
    let canvasDimensions = PHYSICAL_DISPLAY.getCanvasWidthAndHeight();
    let length = PHYSICAL_DISPLAY.getLength();

    return canvasToIndex(...canvasCoords, ...canvasDimensions, length, ROW_COUNT, COLUMN_COUNT);

}
function clientToCanvas(event){
    //! ISSUE WITH getBoundingClientRect(): it returns VERY SLIGHTLY smaller values than it should 
    // Example: DOMRect {x: 7.997159004211426, y: 7.997159004211426, width: 899.9999389648438, height: 899.9999389648438, top: 7.997159004211426, …} instead of 8, 8, 900, 900
    // Apparently, it might have something to do with zooming in and out
    let res = [event.clientX - currentCanvasCoords.left, event.clientY - currentCanvasCoords.top]; 


    //Quick fix: it seems that we encounter this issue only when we click just outside the edge anyways, so this fix should work
    if (res[0] < 0 || res[1] < 0 || res[0] > PHYSICAL_DISPLAY.getCanvasWidthAndHeight()[0] || res[1] > PHYSICAL_DISPLAY.getCanvasWidthAndHeight()[1]){
        return null;
    }
    return res;
}