const _ = require('lodash');
const distance = require('euclidean-distance');

(function() {

    var configuration = {
        minimumDistance: 0
    };

    var selectedElement = null;
    var selectedElementPosition = [0, 0];
    // We record the selected position so that borders/etc don't change it

    const getElements = () => document.getElementsByClassName("abxy");

    const getElementPosition = (elem) => {
        if (elem == null) {
            return [0, 0];
        }
        const b = elem.getBoundingClientRect();
        return [b.left + b.right / 2, b.top + b.bottom / 2]
    }

    const selectElement = (elem) => {
        if (selectedElement != null) {
            selectedElement.classList.remove("abxy-hover");
        }
        selectedElement = elem;
        selectedElementPosition = getElementPosition(selectedElement);
        elem.classList.add("abxy-hover");
    };

    const selectWithFilter = (filter) => {
        const elements = _.filter(getElements(), (elem) => 
            elem != selectedElement && filter(selectedElementPosition, elem)
        );
        selectElementClosestTo(selectedElementPosition, elements);
    }

    const selectUp = () => selectWithFilter((position, elem) =>
        getElementPosition(elem)[1] + configuration.minimumDistance < position[1]);

    const selectDown = () => selectWithFilter((position, elem) =>
        getElementPosition(elem)[1] - configuration.minimumDistance > position[1]);

    const selectLeft = () => selectWithFilter((position, elem) =>
        getElementPosition(elem)[0] + configuration.minimumDistance < position[0]);

    const selectRight = () => selectWithFilter((position, elem) =>
        getElementPosition(elem)[0] - configuration.minimumDistance > position[0]);

    const click = () => {
        if (selectedElement != null) {
            selectedElement.click();
        }
    }

    const selectElementClosestTo = ([x, y], elements=null) => {
        if (elements == null) {
            elements = getElements();
        }
        if (elements.length == 0) {
            return;
        }
        elements = _.sortBy(elements, (elem) => distance([x, y], getElementPosition(elem)));

        
        selectElement(elements[0]);
    };

    window.abxy = {
        init: (_configuration = {}) => {
            Object.assign(configuration, _configuration)

            if (configuration.initialElement != null) {
                selectElement(configuration.initialElement);
            } else {
                selectElementClosestTo([0, 0]);
            }

            document.addEventListener("keydown", (evt) => {
                if (evt.keyCode == 38) {
                    selectUp();
                } else if (evt.keyCode == 40) {
                    selectDown();
                } else if (evt.keyCode == 37) {
                    selectLeft();
                } else if (evt.keyCode == 39) {
                    selectRight();
                } else if (evt.keyCode == 32) {
                    click();
                }
            });

            document.addEventListener("mouseover", (evt) => {
                if (evt.target.classList.contains("abxy")) {
                    selectElement(evt.target);
                }
            })
        }
    }
})();