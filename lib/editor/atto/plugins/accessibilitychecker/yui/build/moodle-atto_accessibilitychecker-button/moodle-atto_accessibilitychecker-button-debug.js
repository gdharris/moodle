YUI.add('moodle-atto_accessibilitychecker-button', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_accessibilitychecker
 * @copyright  2014 Damyon Wiese  <damyon@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_accessibilitychecker-button
 */

/**
 * Accessibility Checking tool for the Atto editor.
 *
 * @namespace M.atto_accessibilitychecker
 * @class Button
 * @extends M.editor_atto.EditorPlugin
 */

var COMPONENT = 'atto_accessibilitychecker';

Y.namespace('M.atto_accessibilitychecker').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    /**
     * The warnings which are displayed.
     *
     * @property _displayedWarnings
     * @type Object
     * @private
     */
    _displayedWarnings: {},

    initializer: function() {
        this.addButton({
            icon: 'e/accessibility_checker',
            callback: this._displayDialogue
        });
    },

    /**
     * Display the Accessibility Checker tool.
     *
     * @method _displayDialogue
     * @private
     */
    _displayDialogue: function() {
        var dialogue = this.getDialogue({
            headerContent: M.util.get_string('pluginname', COMPONENT),
            width: '500px',
            focusAfterHide: true
        });

        // Set the dialogue content, and then show the dialogue.
        dialogue.set('bodyContent', this._getDialogueContent())
                .show();
    },

    /**
     * Return the dialogue content for the tool.
     *
     * @method _getDialogueContent
     * @private
     * @return {Node} The content to place in the dialogue.
     */
    _getDialogueContent: function() {
        var content = Y.Node.create('<div style="word-wrap: break-word;"></div>');
        content.append(this._getWarnings());

        // Add ability to select problem areas in the editor.
        content.delegate('click', function(e) {
            e.preventDefault();

            var host = this.get('host'),
                index = e.target.getAttribute("data-index"),
                node = this._displayedWarnings[index],
                dialogue = this.getDialogue();


            if (node) {
                // Clear the dialogue's focusAfterHide to ensure we focus
                // on the selection.
                dialogue.set('focusAfterHide', null);

                // Hide the dialogue.
                dialogue.hide();

                // Then set the selection.
                host.setSelection(host.getSelectionFromNode(node));
            } else {
                // Hide the dialogue.
                dialogue.hide();
            }
        }, 'a', this);

        return content;
    },

    /**
     * Find all problems with the content editable region.
     *
     * @method _getWarnings
     * @return {Node} A complete list of all warnings and problems.
     * @private
     */
    _getWarnings: function() {
        var problemNodes,
            list = Y.Node.create('<div></div>');

        // Images with no alt text or dodgy alt text.
        problemNodes = [];
        this.editor.all('img').each(function (img) {
            alt = img.getAttribute('alt');
            if (typeof alt === 'undefined' || alt === '') {
                if (img.getAttribute('role') !== 'presentation') {
                    problemNodes.push(img);
                }
            }
        }, this);
        this._addWarnings(list, M.util.get_string('imagesmissingalt', COMPONENT), problemNodes, true);

        problemNodes = [];
        this.editor.all('*').each(function (node) {
            var foreground,
                background,
                ratio,
                lum1,
                lum2;

            // Check for non-empty text.
            if (Y.Lang.trim(node.get('text')) !== '') {
                foreground = node.getComputedStyle('color');
                background = node.getComputedStyle('backgroundColor');

                lum1 = this._getLuminanceFromCssColor(foreground);
                lum2 = this._getLuminanceFromCssColor(background);

                // Algorithm from "http://www.w3.org/TR/WCAG20-GENERAL/G18.html".
                if (lum1 > lum2) {
                    ratio = (lum1 + 0.05) / (lum2 + 0.05);
                } else {
                    ratio = (lum2 + 0.05) / (lum1 + 0.05);
                }
                if (ratio <= 4.5) {
                    Y.log('Contrast ratio is too low: ' + ratio +
                          ' Colour 1: ' + foreground +
                          ' Colour 2: ' + background +
                          ' Luminance 1: ' + lum1 +
                          ' Luminance 2: ' + lum2);

                    // We only want the highest node with dodgy contrast reported.
                    var i = 0, found = false;
                    for (i = 0; i < problemNodes.length; i++) {
                        if (node.ancestors('*').indexOf(problemNodes[i]) !== -1) {
                            // Do not add node - it already has a parent in the list.
                            found = true;
                            break;
                        } else if (problemNodes[i].ancestors('*').indexOf(node) !== -1) {
                            // Replace the existing node with this one because it is higher up the DOM.
                            problemNodes[i] = node;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        problemNodes.push(node);
                    }
                }
            }
        }, this);
        this._addWarnings(list, M.util.get_string('needsmorecontrast', COMPONENT), problemNodes, false);

        if (!list.hasChildNodes()) {
            list.append('<p>' + M.util.get_string('nowarnings', COMPONENT) + '</p>');
        }
        // Append the list of current styles.
        return list;
    },

    /**
     * Generate the HTML that lists the found warnings.
     *
     * @method _addWarnings
     * @param {Node} A Node to append the html to.
     * @param {String} description Description of this failure.
     * @param {array} nodes An array of failing nodes.
     * @param {boolean} imagewarnings true if the warnings are related to images, false if text.
     */
    _addWarnings: function(list, description, nodes, imagewarnings) {
        var warning, fails, i, key, src, textfield;

        if (nodes.length > 0) {
            warning = Y.Node.create('<p>' + description + '</p>');
            fails = Y.Node.create('<ol class="accessibilitywarnings"></ol>');
            i = 0;
            for (i = 0; i < nodes.length; i++) {
                if (imagewarnings) {
                    key = 'image_'+i;
                    src = nodes[i].getAttribute('src');

                    fails.append(Y.Node.create('<li><a data-index="'+key+'" href="#"><img data-index="'+key+'" src="' + src + '" /> '+src+'</a></li>'));
                } else {
                    key = 'text_' + i;

                    textfield = ('innerText' in nodes[i])? 'innerText' : 'textContent';
                    fails.append(Y.Node.create('<li><a href="#" data-index="'+key+'">' + nodes[i].get(textfield) + '</a></li>'));
                }
                this._displayedWarnings[key] = nodes[i];
            }

            warning.append(fails);
            list.append(warning);
        }
    },

    /**
     * Convert a CSS color to a luminance value.
     *
     * @method _getLuminanceFromCssColor
     * @param {String} colortext The Hex value for the colour
     * @return {Number} The luminance value.
     * @private
     */
    _getLuminanceFromCssColor: function(colortext) {
        var color;

        if (colortext === 'transparent') {
            colortext = '#ffffff';
        }
        color = Y.Color.toArray(Y.Color.toRGB(colortext));

        // Algorithm from "http://www.w3.org/TR/WCAG20-GENERAL/G18.html".
        var part1 = function(a) {
            a = parseInt(a, 10) / 255.0;
            if (a <= 0.03928) {
                a = a/12.92;
            } else {
                a = Math.pow(((a + 0.055)/1.055), 2.4);
            }
            return a;
        };

        var r1 = part1(color[0]),
            g1 = part1(color[1]),
            b1 = part1(color[2]);

        return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
    }
});


}, '@VERSION@', {"requires": ["color-base", "moodle-editor_atto-plugin"]});