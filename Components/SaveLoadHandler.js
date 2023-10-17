import handleDisplayChange from "./handleDisplayChange.js";

//!Bad naming: this is not a handler function

export default class SaveLoadHandler{
    constructor(){
        this.SEPERATOR = "&";
    }

    save(logicalCanvas, fileName){
        //Create blob
        //!getState should be implemented here. LogicalCanvas shouldn't care about such low level details related to file format

        //function taken from https://stackoverflow.com/questions/37128624/terse-way-to-intersperse-element-between-all-elements-in-javascript-array
        const intersperse = (arr, sep) => arr.reduce((a,v)=>[...a,v,sep],[]).slice(0,-1)

        const data = new Blob(intersperse(logicalCanvas.getState(), this.SEPERATOR), {type: "text/plain"});
        //!logicalCanvas.getState() should return an array
        
        //Create URL for the blob
        const url = URL.createObjectURL(data);

        //Create temp element
        const tempElement = document.createElement("a");
        tempElement.setAttribute("type", "hidden");//Just in case: we don't want it to be visible
        tempElement.href = url;
        tempElement.download= fileName;

        //Trigger a click to start download
        tempElement.click();

        //Clean up
        URL.revokeObjectURL(url);
        tempElement.remove();
    }
    
    
    load(logicalCanvas, physicalCanvas, dataStr){
        let dataArr = dataStr.split(this.SEPERATOR);
        logicalCanvas.setStrArrState(dataArr);
        handleDisplayChange(logicalCanvas, physicalCanvas);
    }
}