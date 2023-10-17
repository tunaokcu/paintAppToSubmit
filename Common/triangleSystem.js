export {canvasCoordsToVertices, canvasCoordsToTriangleCode, triangleCodeToVertices, canvasToClipCoordinates};

/*
    We have triangles [1, ROW*COLUMN*4]
    Each triangle has 3 points
*/
/*
function generateGrid(){
    let orientations = ["top", "bottom", "left", "right"];
    let grid = {}
    for (let n = 1; n <= ROW; n++){
        for (let m=1; m <= COLUMN; m++ ){
            for (let i = 0; i < 4; i++){    
                let orientation = orientations[i];
                let code = indicesToTriangleCode(m, n, orientation);
                let vertices = triangleCodeToVertices(code);

                grid[code] = vertices;
            }
        }
    }
}
*/

/*
    (m, n) = (1, 1) top => 1 
                    bottom => 2
                    left => 3
                    right => 4
            = (2, 1) => 4 + 1
                    => 4 + 2
                    => 4 + 3
                    => 4 + 4

            = (1, 2) => we have completed (n -1) rows so we have (n-1)*4*COLUMNS in reserve already
                            we have also completed (m-1) columns so we have another (m-1)*4
                        we add 1, 2, 3, or 4 depending on the orientation
*/
function canvasCoordsToTriangleCode(canvasX, canvasY, canvasWidth, canvasHeight, LENGTH, ROW, COLUMN){
    let indices = getSquare([canvasX, canvasY], canvasHeight, LENGTH, ROW, COLUMN);
    let center = squareCenter(...indices, canvasHeight, LENGTH);
    let orientation = triangleOrientation(center, [canvasX, canvasY], LENGTH);

    return indicesToTriangleCode(...indices, orientation, ROW, COLUMN);

}

    //1) Find column and row 
    //2) Find orientation
    //3) Find vertices
    // Use canvasCoordsToVertices as a blueprint
function triangleCodeToVertices(code, canvasWidth, canvasHeight, LENGTH, ROW, COLUMN){
    
    let m, n, orientation;
    [m, n, orientation] = triangleCodeToIndices(code, ROW, COLUMN);
    let indices = [m, n]
    let center = squareCenter(...indices, canvasHeight, LENGTH);

    //we now have center and orientation, exactly as in main.js
    let vertices = centerAndOrientationToVertices(center, orientation, canvasWidth, canvasHeight, LENGTH);

    return vertices
}

// Tested, should be working
//These calculations probably shouldnt be done every time we need to render something. So they should be cached.
// !optimization: cache
// m is column, n is row
function indicesToTriangleCode(m, n, orientation, ROW, COLUMN){
    //! m = [1, COLUMN], n = [1, ROW]
    if (m <= 0 || n <= 0 || m > COLUMN || n > ROW){
        return null;
    }

    let addedWeight = 0;

    switch (orientation){
        case "top":
            addedWeight = 1;
            break;
        case "bottom":
            addedWeight = 2;
            break
        case "left":
            addedWeight = 3;
            break;
        case "right":
            addedWeight = 4;
            break;
        //! orientation cannot be anything else
        default:
            return null;
    }
    //We are at row n, meaning there are (n-1) complete rows below us
    //Each row is of size 4 * COLUMN, therefore there are 4 * COLUMN * (n-1) triangles below us

    //We are at column m, meaning there are (m-1) complete columns to our left
    //Each column is of size 4, so we have 4 * (m-1) triangles to our left

    //In addition, we have our addedWeight
    //error checking: (m=COLUMN, n= ROW, orientation = right) should return ROW * COLUMN *4
    // (ROW-1)*COLUMN*4 + (COLUMN-1)*4 + 4
    // 4*ROW*COLUMN - 4*COLUMN + 4* COLUMN -4 + 4
    // Seems about right
    return (n-1)* COLUMN * 4+ (m-1)*4  + addedWeight
}

// Tested, should be working
function triangleCodeToIndices(code, ROW, COLUMN){


    //We have code = (n-1) * COLUMN * 4 + (m-1) * 4 + addedWeight
    //and we want to find n and m and addedWeight

    //assume n = 1. We are left with (m-1)*4 + addedWeight
    // addedWeight has range [1, 4], so substract it by 1 to make its range [0, 3]
    // now do integer division by 4: we are only left with (m-1)
    //so when n = 1, m = ((code -1) // 4) + 1 


    
    //in the general case, ((code-1)//4) will leave us with
    // ((n-1)*COLUMN + (m-1))
    // so (m-1) = ((code-1)//4) - (n-1)*COLUMN
    // m = ((code-1)//4)-(n-1)*COLUMN + 1
    //where n is the only unknown

    //m is the column number to begin with so (m-1) will range [0, COLUMN-1], meaning integer division by column will leave it as 0:
    // /((n-1)*COLUMN + (m-1)) // COLUMN) will result in (n-1)
    
    //To recap:
    //x = (code-1)//4                       = ((n-1)*COLUMN+(m-1))
    //n = x // COLUMN + 1
    //m = x - (n-1)*COLUMN + 1              = (code-1)//4 - (n-1)*COLUMN + 1 = (n-1)*COLUMN + (m-1) - (n-1)*COLUMN + 1 = m
    //addedWeight = code - (n-1)*COLUMN * 4 - (m-1) * 4 

    let intermediate = Math.floor((code-1) / 4);
    let n = Math.floor(intermediate / COLUMN) + 1;
    let m = intermediate - (n-1)* COLUMN + 1;
    let addedWeight = code - (n-1) * COLUMN * 4 - (m-1) * 4;
    let orientation;


    switch (addedWeight){
        case 1:
            orientation = "top";
            break;
        case 2:
            orientation = "bottom";
            break
        case 3:
            orientation = "left";
            break;
        case 4:
            orientation = "right";
            break;
        /*
        //! orientation cannot be anything else
        default:
            return null;
        */
    }

    return [m, n, orientation]
}
 
//! Anything below this has been tested 
function canvasCoordsToVertices(clientX, clientY, canvasHeight, canvasWidth, LENGTH, ROW, COLUMN){
    //1)Find the triangle clicked on
    //2)Translate to clip coords
    let indices = getSquare([clientX, clientY], canvasHeight, LENGTH, ROW, COLUMN);
    let center = squareCenter(...indices, canvasHeight, LENGTH);
    let orientation = triangleOrientation(center, [clientX, clientY], LENGTH);
    let vertices = centerAndOrientationToVertices(center, orientation, canvasWidth, canvasHeight, LENGTH);

    return vertices
}
//Given the location of the mouse in clip coordinates
//Return the index of the square [m, n] where [1, 1] is the leftmost corner and [COLUMN, ROW] is the rightmost corner
function getSquare(mouseLocation, canvasHeight, LENGTH, ROW, COLUMN){
    //Bottom left corner has coords (-1, -1)
    //Bottom left triangle has center coords (-1 + l/2, -1+l/2)
    let leftMostX = 0;
    let leftMostY = canvasHeight;

    let distanceX = mouseLocation[0] - leftMostX;
    let distanceY = -mouseLocation[1] + leftMostY;
    //We are [distanceX, distanceY] away from leftmost corner
    //If we are [distanceX, distanceY] away, we should find which square we are in
    //Within [0, 0], [l, 0], [0, l], [l, l] we are in the first square
    //Within [l, 0], [2l, 0], [l, l], [2l, l] we are in the first square
    //Within [(m-1)l, 0], [m*l, 0], [(m-1)l, l], [m*l, l] we are in the mth square 
    //Within [(m-1)l, (n-1)l], [m*l, (n-1)l], [(m-1)l, n*l], [m*l, n*l] we are in (m,n)th square  
    let res = [Math.floor(distanceX / LENGTH) + 1, Math.floor(distanceY / LENGTH) + 1]; 

    //! optimization: there's probably a more elegant fix
    if (res[0] > COLUMN) { res[0] = COLUMN; }
    if (res[1] > ROW) { res[1] = ROW; }
    return res;
}
//Given the location of the square in index form [m, n]
//Return the center of the square it lies in(in canvas coordinates)
function squareCenter(m, n, canvasHeight, LENGTH){
    //The center of the (m,n)th square is [(m-0.5)l-1, (n-0.5)l-1]
    return [(m-0.5)*LENGTH, canvasHeight-(n-0.5)*LENGTH];
}

function centerAndOrientationToVertices(center, orientation, canvasWidth, canvasHeight, LENGTH){
    let i2, i3;
 
    
    if (orientation === "top"){
        i2 = [center[0] - LENGTH/2, center[1] + LENGTH/2];
        i3 = [center[0] + LENGTH/2, center[1] + LENGTH/2];
    }
    else if (orientation === "bottom"){
        i2 = [center[0] - LENGTH/2, center[1] - LENGTH/2];
        i3 = [center[0] + LENGTH/2, center[1] - LENGTH/2];
    }
    else if (orientation === "left"){
        i2 = [center[0] - LENGTH/2, center[1] + LENGTH/2];
        i3 = [center[0] - LENGTH/2, center[1] - LENGTH/2];
    }
    else if (orientation === "right"){
        i2 = [center[0] + LENGTH/2, center[1] + LENGTH/2];
        i3 = [center[0] + LENGTH/2, center[1] - LENGTH/2];
    }
    else{
        return "ERROR"
    }

    let res = [center, i2, i3].map((coords) => canvasToClipCoordinates(...coords, canvasWidth, canvasHeight));
    [center, i2, i3] = res;
    return [...center, ...i2, ...i3];
}


//Given the center of the square the mouse is in(in canvas coords) and
//the mouse location(in canvas coords)
//Return whether the triangle is right, top, left, or bottom
function triangleOrientation(triangleCenter, mouseLocation, LENGTH){
    let centerX, centerY;
    [centerX, centerY] = triangleCenter; 

    let leftX = centerX - LENGTH/2;
    let rightX = centerX + LENGTH/2;
    let topY = centerY + LENGTH/2;
    let bottomY = centerY - LENGTH/2;

    let topLeft = [leftX, topY];
    let topRight = [rightX, topY];
    let bottomLeft = [leftX, bottomY];
    let bottomRight = [rightX, bottomY];

    let topTriangle = [topLeft, topRight, triangleCenter];
    let bottomTriangle = [bottomLeft, bottomRight, triangleCenter];
    let leftTriangle = [topLeft, bottomLeft, triangleCenter];
    let rigthTriangle = [topRight, bottomRight, triangleCenter];

    if (pointInTriangle(mouseLocation, topTriangle, LENGTH)){
        return "top";
    } else if (pointInTriangle(mouseLocation, bottomTriangle, LENGTH)){
        return "bottom";
    } else if (pointInTriangle(mouseLocation, leftTriangle, LENGTH)){
        return "left";
    } else if (pointInTriangle(mouseLocation, rigthTriangle, LENGTH)){
        return "right";
    }

    return "invalid";

}

// Code adapted from https://www.geeksforgeeks.org/check-whether-a-given-point-lies-inside-a-triangle-or-not/
// Here point is an array of size 2 and triangle is a 2d array of three points
function pointInTriangle(point, triangle, LENGTH){
    let totalArea, subArea1, subArea2, subArea3;
    totalArea = (LENGTH/2) * (LENGTH/2); //this shouldnt actually be called like this for it to be generalize well: it should be area(triangle[0], triangle[1], triangle[2])

    subArea1 = area([point, triangle[1], triangle[2]]);
    subArea2 = area([triangle[0], point, triangle[2]]);
    subArea3 = area([triangle[0], triangle[1], point]);
    return totalArea === (subArea1+subArea2+subArea3); 
}

function area(triangle){
    let x1, x2, x3, y1, y2, y3;
    [x1, y1] = triangle[0];
    [x2, y2] = triangle[1];
    [x3, y3] = triangle[2];
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1)
                + x3 * (y1 - y2)) / 2.0)
}

function canvasToClipCoordinates(canvasX, canvasY, canvasWidth, canvasHeight){
    let clipX = -1 + 2 * canvasX / canvasWidth;
    let clipY = 1 - 2 * canvasY / canvasHeight;

    return [clipX, clipY];
}