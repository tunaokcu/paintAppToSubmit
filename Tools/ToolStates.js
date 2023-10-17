import ToolState from "./ToolState.js";
export {Cursor, Brush, Eraser, Select};

// TODO
class Cursor extends ToolState{
    #panning;

    constructor(logicalCanvas, physicalCanvas){
        super(logicalCanvas, physicalCanvas)
        this.#panning = false;
    }

    mousedownHandler(index, canvasCoords){
        let canPan = this.logicalCanvas.canPan();
        if (canPan){
            console.log("started panning");
            this.#startPanning(canvasCoords);
            return true;
        }
        else{
            console.log("attempted panning when the screen is not zoomed in")
            return false;
        }
    }
    mousemoveHandler(index, canvasCoords){
        if (this.#panning){
            console.log("continuing panning");
            this.#continuePanning(canvasCoords);
            return true;
        }
        else{
            return false;
        }
    }
    mouseupHandler(index, canvasCoords){
        if (this.#panning){
            console.log("stopped panning");
            this.#endPanning(canvasCoords);
            return true;
        }
        else{
            return false;
        }
    }


    //TODO IMPLEMENT start continue end
    //Will probably have to set view matrix
    //Will have to return true/false based on whether a change has been made on the screen
    #lastCoords;
    #startPanning(canvasCoords){
        this.#panning = true;
        this.#lastCoords = canvasCoords;
    }
    #continuePanning(canvasCoords){
        let delta = [canvasCoords[0] - this.#lastCoords[0], canvasCoords[1] - this.#lastCoords[1]]
        console.log("panned by", delta);
        this.#lastCoords = canvasCoords;
    }
    #endPanning(canvasCoords){
        this.#panning = false;
    }

    getName(){
        return "cursor";
    }
}

//Helper class for Select
class Rectangle{
    #isActive;
    #startLocation;
    #endLocation
    constructor(){
        this.disable();
    }
    setStartlocation(startLocation){
        this.#startLocation = startLocation;
    }
    setEndLocation(endLocation){
        this.#endLocation = endLocation;
    }
    getStartLocation(){ return this.#startLocation; }
    getEndLocation(){ return this.#endLocation; }
    disable(){
        this.#isActive = false;
    }
    enable(){
        this.#isActive = true;
    }
    isActive(){
        return this.#isActive;
    }

    getLocationsWidthHeight(){
        let x = Math.min(this.#startLocation[0], this.#endLocation[0]);
        let y = Math.min(this.#startLocation[1], this.#endLocation[1]);
        let w = Math.max(this.#startLocation[0], this.#endLocation[0]) - x;
        let h = Math.max(this.#startLocation[1], this.#endLocation[1]) - y;

        return [x, y, w, h];
    }

    shiftBy(x, y){
        let start = this.getStartLocation();
        let end = this.getEndLocation();

        this.setStartlocation([start[0] + x, start[1] + y]);
        this.setEndLocation([end[0] + x, end[1] + y]);
    }
}

// TODO
//!Bad code: keeping selectionRectangle coords in both Select state and in PhysicalCanvas
class Select extends ToolState{
    #cursorStart;
    #cursorEnd;
    #trianglesWithinRectangle;

    #state
 
    #tStart;
    #tEnd;

    #RECTANGLE;
    #RECTANGLE_COPY;
    constructor(logicalCanvas, physicalCanvas){
        super(logicalCanvas, physicalCanvas)
        this.#RECTANGLE = new Rectangle();
        this.reset();
        this.physicalCanvas.setSelectionRectangle(this.#RECTANGLE);//We pass by reference our rectangle
    }

    #isCopying = false;

    mousedownHandler(index, canvasCoords){
        this.#tStart = new Date();
        switch (this.#state){
            case "idle": //Now selection has started
                this.#state = "selecting";
                this.#RECTANGLE.setStartlocation(canvasCoords);
                this.#RECTANGLE.setEndLocation(canvasCoords);
                this.#RECTANGLE.enable();
                return false; //no change
            case "selecting":
                console.log("this should never happen");
                return false;
            case "adjusting" : //Will work for copying as well
                return this.handleMouseDownForFormedRectangle(canvasCoords);
            case "copying" : //Will work for copying as well
                let changesMade = this.handleMouseDownForFormedRectangle(canvasCoords);
                this.#state += "copy";//so the state is now "selectingcopy" or "draggingcopy"
                return changesMade;
        }
    }

    handleMouseDownForFormedRectangle(canvasCoords){
        //if outside rectangle, start selection again
        if (!this.#isInsideRectangle(canvasCoords)){
            this.#RECTANGLE.disable();
            this.#state = "selecting";
            this.#RECTANGLE.setStartlocation(canvasCoords);
            this.#RECTANGLE.setEndLocation(canvasCoords);
            this.#RECTANGLE.enable();
            return true; //remove older rectangle                    
        }
        //if not, start dragging
        else{
            this.#cursorStart = canvasCoords;

            //1)Find every non-empty triangle within the rectangle 
            this.#trianglesWithinRectangle = this.physicalCanvas.getAllTrianglesWithinRectangle(this.logicalCanvas.getActiveLayer()); 
            this.#state = "dragging";
            return false
            //2)Whenever mouse is moved, check if it has been moved by L , i.e. the length of a rectangle
            //3)Shift every triangle within the rectangle left/right/up/down, not forgetting to change shifted parts to blanks
        }
    }
    
    mousemoveHandler(index, canvasCoords){
        switch (this.#state){
            case "idle": //It's idle, there's nothing to do
                return false;
            case "selecting":
                this.#RECTANGLE.setEndLocation(canvasCoords);
                return true;
            case "dragging":
                return this.handleMouseMoveForFormedRectangle(canvasCoords, false);
        }
    }

    handleMouseMoveForFormedRectangle(canvasCoords){
        this.#cursorEnd = canvasCoords;

        let xDelta = this.#cursorEnd[0] - this.#cursorStart[0];
        let yDelta = this.#cursorEnd[1] - this.#cursorStart[1];
    
        let xDisplacementInSquares = (xDelta / this.physicalCanvas.getLength());
        let yDisplacementInSquares = (yDelta/ this.physicalCanvas.getLength());

        //Integer division
        xDisplacementInSquares = xDisplacementInSquares > 0 ? Math.floor(xDisplacementInSquares) : Math.ceil(xDisplacementInSquares);
        yDisplacementInSquares = yDisplacementInSquares > 0 ? Math.floor(yDisplacementInSquares) : Math.ceil(yDisplacementInSquares);

        //So that we do not lose the leftovers
        let xDis = xDisplacementInSquares * this.physicalCanvas.getLength();
        let yDis =  yDisplacementInSquares * this.physicalCanvas.getLength();

        this.#cursorStart[0] += xDis;
        this.#cursorStart[1] += yDis

        this.#RECTANGLE.shiftBy(xDis, yDis);

        
        if (xDisplacementInSquares !== 0 || yDisplacementInSquares !== 0){
            yDisplacementInSquares = -yDisplacementInSquares; //y coordinates increase in the down direction in the canvas
            this.#shift(xDisplacementInSquares, yDisplacementInSquares);
            return true;
        }
        return false;  
    }

    #shift(x, y){
        this.logicalCanvas.shift(this.#trianglesWithinRectangle, x, y)//Shift every element within rectangle by x and y 
                                                                      //Shift by x <=> += x*4
                                                                      //Shift by y <=> += y*COLUMNS*4
                                                                      //First calculate x-shift. If, when x-shifted, the element is shifted onto a new row, remove that element
                                                                      //Then calculate y-shift. Check whether i > ROW*COLUMN*4(max index)
                                                                      //Add stroke

    }

    #TMIN = 100;
    mouseupHandler(index, canvasCoords){
        switch (this.#state){
            case "selecting":
                //Check if it has been clicked outside(fast), putting an end to selection
                this.#tEnd = new Date();
                if (this.#tEnd - this.#tStart < this.#TMIN){
                    this.#state = "idle";
                    return true;
                }

                this.#state = "adjusting";
                return false;
            case "dragging":
                this.#isCopying = false;
                this.#state = "adjusting";
                return false;
                
        }
        return false;
    }

    copyRectangle(){
        if (this.#state === "adjusting"){ //selection is complete, we can copy
            //TODO
            this.#state = "copying"; //same as adjusting, except we can also paste the rectangle and 
                                     //we operate on a temporary layer and copy the contents on that temporary layer to the original layer at the end
            //Copy original rectangle in case it gets lost(dragged outside the canvas for example)
            this.#RECTANGLE_COPY = new Rectangle();
            this.#RECTANGLE_COPY.setStartlocation(this.#RECTANGLE.getStartLocation());
            this.#RECTANGLE_COPY.setEndLocation(this.#RECTANGLE.setEndLocation());

            this.logicalCanvas.activateTempLayer(this.#trianglesWithinRectangle);
        }
        return false; //cannot copy
    }
    pasteRectangle(){
        if (this.#isCopying){ //copying is complete, we can paste
            //In paint when you press ctrl-v it pastes the copied section to the upper left corner and draws a selection rectangle around it
            //TODO
        }
        return false; //cannot paste
    }
    #isInsideRectangle(canvasCoords){
        let x, y, w, h;
        [x, y, w, h] = this.#RECTANGLE.getLocationsWidthHeight();

        let curX, curY;
        curX = canvasCoords[0];
        curY = canvasCoords[1];

        let res = (curX >= x && curX <= x + w && curY >= y && curY <= y + h);
        return res;
    }

    /* Do we need to complicate this ?
    #MINIMUM_DISPLACEMENT = 1; //Set an appropriate lower bound
    #hasVisibleRectangle(){
        let x, y;
        x = Math.abs(this.#startLocation[0] - this.#endLocation[0]);
        y = Math.abs(this.#startLocation[1] - this.#endLocation[1]);

        return (x > this.#MINIMUM_DISPLACEMENT && y > this.#MINIMUM_DISPLACEMENT);
    }
    */
    getName(){
        return "select";
    }
    reset(){
        this.#state = "idle";
        this.#RECTANGLE.disable();
        return true;
    }
}

class Brush extends ToolState{
    constructor(logicalCanvas, physicalCanvas){
        super(logicalCanvas, physicalCanvas)
    }

    mousedownHandler(index, canvasCoords){
        return this.logicalCanvas.getActiveLayer().startStroke(index, this.logicalCanvas.getCurrentColor());
    }
    mousemoveHandler(index, canvasCoords){
        return this.logicalCanvas.getActiveLayer().continueStroke(index, this.logicalCanvas.getCurrentColor());
    }
    mouseupHandler(index, canvasCoords){
        return false;
    }

    getName(){
        return "brush";
    }
}
class Eraser extends ToolState{
    constructor(logicalCanvas, physicalCanvas){
        super(logicalCanvas, physicalCanvas)
    }

    mousedownHandler(index, canvasCoords){
        return this.logicalCanvas.getActiveLayer().startStroke(index, null);
    }
    mousemoveHandler(index, canvasCoords){
        return this.logicalCanvas.getActiveLayer().continueStroke(index, null);
    }
    mouseupHandler(index, canvasCoords){
        return false;
    }

    getName(){
        return "eraser";
    }
}

