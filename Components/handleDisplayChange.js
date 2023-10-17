//Our render function
export default function handleDisplayChange(logicalCanvas, physicalCanvas){
        if (logicalCanvas.hasVisibleLayers()){
            physicalCanvas.renderAll(logicalCanvas.getVisibleLayers(), logicalCanvas.getTemporaryLayer(), logicalCanvas.hasTemporaryLayer());
        }
        else{
            physicalCanvas.renderBlank();
        }
    }
    