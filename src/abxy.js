const _ = require('lodash');
const distance = require('euclidean-distance');

(function() {

    var configuration = {
        minimumDistance: 0,

        // Keyboard configuration
        keyboard_upButton: 38,
        keyboard_downButton: 40,
        keyboard_leftButton: 37,
        keyboard_rightButton: 39,

        keyboard_aButton: 32,
        keyboard_bButton: 1,
        keyboard_xButton: 1,
        keyboard_yButton: 1,

        // Gamepad configuration
        // TODO: Swap in a gamepad library here to normalize all this
        gamepad_xAxis: 0,
        gamepad_yAxis: 1,
        gamepad_analogueThreshold: 0.4,
        gamepad_inputTimeout: 200,

        gamepad_upButton: 0,
        gamepad_leftButton: 2,
        gamepad_downButton: 1,
        gamepad_rightButton: 3,

        gamepad_aButton: 11,
        gamepad_bButton: 12,
        gamepad_xButton: 13,
        gamepad_yButton: 14,
    };

    var selectedElement = null;
    // We record the selected position so that borders/etc don't change it
    var selectedElementPosition = [0, 0];
    var lastMove = 0;


    const keyboardMapping = {};
    const gamepadMapping = {};
    const analogueMapping = {};

    const getSelectedElement = () => {
        if (!selectedElement || !document.contains(selectedElement)) {
            selectedElement = null;
            selectedElementPosition = [0, 0];
            // abxy.selectElementClosestTo([0, 0])
        }
        return [selectedElement, selectedElementPosition];
    }

    const getElements = () => document.getElementsByClassName("abxy");

    const selectWithFilter = (filter) => {
        var [selectedElement, selectedElementPosition] = getSelectedElement();
        const elements = _.filter(getElements(), (elem) => 
            elem != selectedElement && filter(selectedElementPosition, elem)
        );
        abxy.selectElementClosestTo(selectedElementPosition, elements);
    }

    const selectUp = () => {
        selectWithFilter((position, elem) =>
            abxy.getElementPosition(elem)[1] + configuration.minimumDistance < position[1]);
        document.dispatchEvent(new Event('abxy-move-selection'));
    }

    const selectDown = () => {
        selectWithFilter((position, elem) =>
            abxy.getElementPosition(elem)[1] - configuration.minimumDistance > position[1]);
        document.dispatchEvent(new Event('abxy-move-selection'));
    }

    const selectLeft = () => {
        selectWithFilter((position, elem) =>
            abxy.getElementPosition(elem)[0] + configuration.minimumDistance < position[0]);
        document.dispatchEvent(new Event('abxy-move-selection'));
    }

    const selectRight = () => {
        selectWithFilter((position, elem) =>
            abxy.getElementPosition(elem)[0] - configuration.minimumDistance > position[0]);
        document.dispatchEvent(new Event('abxy-move-selection'));
    }

    const click = () => {
        var [selectedElement, selectedElementPosition] = getSelectedElement();
        if (selectedElement != null) {
            selectedElement.click();
        }
    }

    window.abxy = {
        getElementPosition: (elem) => {
            if (elem == null) {
                return [0, 0];
            }
            const b = elem.getBoundingClientRect();

            const width = b.right - b.left;
            const height = b.bottom - b.top;

            const bodyRect = document.body.getBoundingClientRect();

            const c = [b.left - bodyRect.left, b.top - bodyRect.top];

            return [c[0] + width / 2, c[1] + height / 2]
        },

        getSelectedElement: () => {
            return selectedElement;
        },

        selectElement: (elem) => {
            if (selectedElement != null) {
                selectedElement.classList.remove("abxy-hover");
            }
            selectedElement = elem;
            selectedElementPosition = abxy.getElementPosition(selectedElement);
            elem.classList.add("abxy-hover");
        },

        selectElementClosestTo: ([x, y], elements=null) => {
            if (elements == null) {
                elements = getElements();
            }
            if (elements.length == 0) {
                return;
            }
            elements = _.sortBy(elements, (elem) => distance([x, y], abxy.getElementPosition(elem)));

            
            abxy.selectElement(elements[0]);
        },

        init: (_configuration = {}) => {
            Object.assign(configuration, _configuration);

            keyboardMapping[configuration.keyboard_upButton] = selectUp;
            keyboardMapping[configuration.keyboard_downButton] = selectDown;
            keyboardMapping[configuration.keyboard_leftButton] = selectLeft;
            keyboardMapping[configuration.keyboard_rightButton] = selectRight;
            keyboardMapping[configuration.keyboard_aButton] = click;

            gamepadMapping[configuration.gamepad_upButton] = selectUp;
            gamepadMapping[configuration.gamepad_downButton] = selectDown;
            gamepadMapping[configuration.gamepad_leftButton] = selectLeft;
            gamepadMapping[configuration.gamepad_rightButton] = selectRight;
            gamepadMapping[configuration.gamepad_aButton] = click;

            analogueMapping[configuration.gamepad_xAxis] = [selectLeft, selectRight];
            analogueMapping[configuration.gamepad_yAxis] = [selectUp, selectDown];

            if (configuration.initialElement != null) {
                abxy.selectElement(configuration.initialElement);
            } else {
                abxy.selectElementClosestTo([0, 0]);
            }

            // Set up keyboard control
            document.addEventListener("keydown", (evt) => {
                _.forOwn(keyboardMapping, (func, keyCode) => {
                    if (evt.keyCode == keyCode) func();
                });
            });

            // Set up mouse control
            document.addEventListener("mouseover", (evt) => {
                if (evt.target.classList.contains("abxy")) {
                    abxy.selectElement(evt.target);
                }
            });

            // Set up gamepad control
            if (navigator.getGamepads) {
                setInterval(() => _.each(navigator.getGamepads(), (gamepad) => {
                    if (gamepad.connected) {
                        // We don't care about disconnected ones

                        if (Date.now() - lastMove > configuration.gamepad_inputTimeout) {

                            _.forOwn(analogueMapping, ([lessFunc, moreFunc], axis) => {
                                if (gamepad.axes[axis] > configuration.gamepad_analogueThreshold) {
                                    moreFunc();
                                } else if (gamepad.axes[axis] < 0 - configuration.gamepad_analogueThreshold) {
                                    lessFunc();
                                }
                                lastMove = Date.now();
                            });

                            // Then DPad
                            _.forOwn(gamepadMapping, (func, buttonIndex) => {
                                if (gamepad.buttons[buttonIndex].pressed) {
                                    func();
                                    lastMove = Date.now();
                                }
                            });
                        }
                    }
                }), 10);
            };
        }
    }
})();