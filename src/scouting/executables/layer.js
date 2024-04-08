/**
 * Shows another layer on button press
 * @param fromLayer the layer number the executable is transitioning from (normally the layer which contains the button)
 * @param toLayer the layer which the executable is transitioning to (the layer that will be shown).
 */
executables["layer"] = {
    execute(button,layers,fromLayer,toLayer) {
        console.log("Transitioning to layer "+toLayer+" from layer "+fromLayer+"...");
        for (let button of layers.flat()) { //hide all buttons
            button.element.style.display = "none"
        }
        var renderedButtons = []
        for (let button of layers[toLayer]) {
            button.element.style.display = "flex";
            renderedButtons.push(button)
        }
        previousLayers.push(renderedButtons)
    },
    reverse(button,layers,fromLayer,toLayer) {
        console.log("Reversing layer transition..."); 
        for (let button of layers.flat()) { //hide all buttons
            button.element.style.display = "none"
        }
        previousLayers.pop();
        previousLayers.pop();
        console.log("These are the previous layers.."+previousLayers)
        for (let button of previousLayers[previousLayers.length-1]) {
              
          button.element.style.display = "flex"
        }
    }
}