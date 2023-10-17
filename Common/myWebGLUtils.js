//webgl-utils clone developed by me because the original wasn't working when imported
export {WebGLUtils};

class WebGLUtils{
    //constructor(){}

    static setupWebGL( canvas ){
        return canvas.getContext('webgl');
    }
}