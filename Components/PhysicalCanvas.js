import { VERTICES_IN_TRIANGLE, BACKGROUND_COLOR, POSITION_BUFFER_SIZE, COLOR_BUFFER_SIZE} from "../constants.js";
import { triangleCodeToVertices as indexToVertices, triangleCodeToVertices, canvasToClipCoordinates, canvasCoordsToTriangleCode } from "../Common/triangleSystem.js";

//Common
import {initShaders} from "../Common/initShaders.js";
import {WebGLUtils} from "../Common/myWebGLUtils.js";
import {flatten} from "../Common/MV.js";
import DisplayMap from "../Classes/DisplayMap.js";

export default class PhysicalCanvas{
    #canvas;
    #gl;
    #program;

    #canvasWidth;
    #canvasHeight;
    #SQUARE_LENGTH;

    #ROW_COUNT;
    #COLUMN_COUNT;
    #MAX_VERTICES;

    #LAYER_COUNT;
    
    //Buffers
    #positionBuffer
    #vPosition
    #colorBuffer
    #vColor
    
    //Selection rectangle
    #selectionRectangleColor = flatten([241/255, 53/255, 241/255, 0.6, 241/255, 53/255, 241/255, 0.6, 241/255, 53/255, 241/255, 0.6, 241/255, 53/255, 241/255, 0.6]);

    constructor(rowCount, columnCount, layerCount){
            this.#ROW_COUNT = rowCount;
            this.#COLUMN_COUNT = columnCount;
            this.#MAX_VERTICES = this.#calculateMaxVertices();

            // Setup
            this.#canvas = document.getElementById( "gl-canvas" );
            this.#gl = WebGLUtils.setupWebGL( this.#canvas );
            if ( !this.#gl ) { alert( "WebGL isn't available" ); }

            this.#canvasWidth = this.#canvas.width;
            this.#canvasHeight = this.#canvas.height;
            
            this.#setCanvasDependentVariables();
        
            this.#gl.clearColor( ...BACKGROUND_COLOR );
            this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
            this.#gl.enable(this.#gl.DEPTH_TEST);

            this.#program = initShaders( this.#gl, "vertex-shader", "fragment-shader" );
            this.#gl.useProgram( this.#program ); 
    
            // Buffers
            let program = this.#program;
            let gl = this.#gl;

            this.#positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, POSITION_BUFFER_SIZE*this.#MAX_VERTICES, gl.STATIC_DRAW);
        
            this.#vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(this.#vPosition, 2, gl.FLOAT, false, 0, 0); //change here
            gl.enableVertexAttribArray(this.#vPosition);

            this.#colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, COLOR_BUFFER_SIZE*this.#MAX_VERTICES, gl.STATIC_DRAW);
            
            this.#vColor = gl.getAttribLocation(program, "vColor");
            gl.vertexAttribPointer(this.#vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.#vColor);


    }

    #calculateMaxVertices(){
        return this.#ROW_COUNT*this.#COLUMN_COUNT*4*VERTICES_IN_TRIANGLE + 4; //+4 for the selection rectangle, *4 for triangles in box
    }

    #RECTANGLE
    setSelectionRectangle(rectangle){
        this.#RECTANGLE = rectangle;
    }


    //! Very sloppy code, fix for better accuracy
    getAllTrianglesWithinRectangle(Layer){
        let x, y, w, h;
        [x, y, w, h] = this.#RECTANGLE.getLocationsWidthHeight();

        //These are in clip coords now
        let upLeft = [x, y];
        let upRight = [x+w, y];
        let downLeft = [x, y+h];
        let downRight = [x+w, y+h];
        
        let displayMap = Layer.getDisplayMap().getDisplayMap();
        let displayMapWithinRectangle = new DisplayMap({});

        let increment = this.#SQUARE_LENGTH / 4;
        for (let curX = x ; curX <= x+w; curX += increment){
            for (let curY = y; curY <= y+h; curY += increment){
                let curIndex = canvasCoordsToTriangleCode(curX, curY, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);

                if (displayMap.hasOwnProperty(curIndex)){
                    displayMapWithinRectangle.setColor(curIndex, displayMap[curIndex]);
                }
            }
        }

        return displayMapWithinRectangle;
        /*
        upLeft = canvasCoordsToTriangleCode(...upLeft, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);
        upRight = canvasCoordsToTriangleCode(...upRight, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);
        downLeft = canvasCoordsToTriangleCode(...downLeft, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);
        downRight = canvasCoordsToTriangleCode(...downRight, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);
        */

    }
    //TODO fix
    //Correct if not for #selectionRectangleStart and #selectionRectangleEnd coordinates
    #drawAndRenderSelectionRectangle(startIndex){
        if (this.#RECTANGLE.isActive()){

            let x, y, w, h;
            [x, y, w, h] = this.#RECTANGLE.getLocationsWidthHeight();
            
            
            //These are in clip coords now
            let upLeft = this.#canvasToClip(x, y, this.#canvasWidth, this.#canvasHeight);
            let upRight = this.#canvasToClip(x+w, y, this.#canvasWidth, this.#canvasHeight);
            let downLeft = this.#canvasToClip(x, y+h, this.#canvasWidth, this.#canvasHeight);
            let downRight = this.#canvasToClip(x+w, y+h, this.#canvasWidth, this.#canvasHeight);

            let vertices = flatten([...upLeft, ...upRight, ...downRight, ...downLeft]);
            //Now draw and render
            let gl = this.#gl;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, POSITION_BUFFER_SIZE*startIndex, flatten(vertices));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#colorBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, COLOR_BUFFER_SIZE*startIndex, this.#selectionRectangleColor);//! 3 times the value because we color 3 indices with color value
            
            //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); uncommenting this will write over all the triangles
            this.#gl.drawArrays(gl.LINE_LOOP, startIndex, 4);
        }
    }

    #canvasToClip(x, y){
        let leftMostX = 0;
        let leftMostY = this.#canvasHeight;
    
        let distanceX =  (x - leftMostX) / this.#canvasWidth;
        let distanceY =  (-y + leftMostY) / this.#canvasHeight;

        return [2*distanceX -1, 2*distanceY -1]; //since leftmost is -1, -1 in canvas coords
    }
    /*
    resizeArea(newWidth, newHeight){
        this.#canvasWidth = newWidth;
        this.#canvasHeight = newHeight;
    }
    */
   

   #setCanvasDependentVariables(){
        this.#SQUARE_LENGTH = this.#canvasWidth / this.#COLUMN_COUNT;
        this.#gl.viewport( 0, 0, this.#canvasWidth, this.#canvasHeight );
   }

   getCanvasWidthAndHeight(){
        return [this.#canvasWidth, this.#canvasHeight];
   }

   getLength(){
    return this.#SQUARE_LENGTH;
   }

   //We are guaranteed to get a non-empty layers array
   renderAll(layers, temporaryLayer, hasTemporaryLayer){
        //We have layers.length layers
        //We want to merge indices first s.t. strokes on a layer with a lower index(closer to camera) overwrites the changes on a layer with a higher index
        let finalLayers = layers;
        if (hasTemporaryLayer){
            finalLayers = finalLayers.concat(layers); //temp is on top
        }

        let finalIndexMap = this.#calculateFinalIndexMap(finalLayers);
        /*
        this.#drawTriangles(finalIndexMap);

        let verticesToRender = finalIndexMap.keys().length * VERTICES_IN_TRIANGLE;
        */
        let verticesToRender = this.#drawTrianglesAndReturnVertexCount(finalIndexMap);
        this.#render(verticesToRender);
        this.#drawAndRenderSelectionRectangle(verticesToRender); //start from there
   }
   renderBlank(){
        let gl = this.#gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    
        this.#drawAndRenderSelectionRectangle(0);
    }
   
   #calculateFinalIndexMap(layers){
        let finalIndexMap = {...layers[0].getDisplayMap()}; //!! THIS IS A SHALLOW COPY; IF LAYERS HAS OBJECTS IT WILL COPY REFERENCES INSTEAD OF CLONING THEM

        for (let i = 1; i < layers.length; i++){
            for (const [key, value] of Object.entries(layers[i].getDisplayMap())) {
                if (!finalIndexMap.hasOwnProperty(key)){//If a closer layer doesn't have that index full yet
                    finalIndexMap[key] = value;
                }
            }
        }

        return finalIndexMap;
   }
   
   #drawTrianglesAndReturnVertexCount(indexMap){
        let vertexCount = 0;
        let gl = this.#gl;

        for (const [key, value] of Object.entries(indexMap)) {
            let vertices = indexToVertices(key, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);


            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, POSITION_BUFFER_SIZE*(vertexCount), flatten(vertices));
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#colorBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, COLOR_BUFFER_SIZE*(vertexCount), flatten(value.concat(value, value)));//! 3 times the value because we color 3 indices with color value

            vertexCount += VERTICES_IN_TRIANGLE;
        }

        return vertexCount;
   }

    #render(verticesToRender){
        let gl = this.#gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < verticesToRender; i += VERTICES_IN_TRIANGLE){
            gl.drawArrays(gl.TRIANGLES, i, VERTICES_IN_TRIANGLE);
        }
    }
   //todo remove
   #drawTriangles(indexMap){
        let vertexCount = 0;
        let gl = this.#gl;

        for (const [key, value] of Object.entries(indexMap)) {
            let vertices = indexToVertices(key, ...this.getCanvasWidthAndHeight(), this.getLength(), this.#ROW_COUNT, this.#COLUMN_COUNT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, POSITION_BUFFER_SIZE*(vertexCount), flatten(vertices));

            gl.bindBuffer(gl.ARRAY_BUFFER, this.#colorBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, COLOR_BUFFER_SIZE*(vertexCount), flatten(value + value + value));//! 3 times the value because we color 3 indices with color value

            vertexCount += VERTICES_IN_TRIANGLE;
        }
   }

   /*
   //layer is a map {index: color}
    render(layer){
        for (const [key, value] of Object.entries(layer)) {
            let vertices = indexToVertices(key, ...this.getCanvasWidthAndHeight(), this.getLength());
            
            //draw all vertices
            //render all vertices


        }
    }
    */
   


}