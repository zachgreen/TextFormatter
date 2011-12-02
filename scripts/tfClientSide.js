/// <reference path="jquery-1.6.4.js" />
/// <reference path="jquery-1.6-vsdoc.js" />
$(document).ready(function () {
    TextFormatter.init();
});

var TextFormatter = TextFormatter || {
    init: function () {
        var container = $('#tf');
        var txtAreas = $('.tf_input');
        var input = $('#txtInput');
        var output = $('#txtOutput');
        var submitModifiers = $('#btnSubmitModifiers');
        var modifierContainer = $('#tf_modifier_container');
        var modifierInput = $('#tf_modifier_input');
        var modifierOutput = $('#tf_modifier_output');
        var flipBackButton = $('#btnFlipBack');
        var ckbAddLineBreaks = $('#ckbAddLineBreaks');
        var ckbRemoveLineBreaks = $('#ckbRemoveLineBreaks');

        //focus on the initial text box
        input.focus();

        //add checked event for check boxes
        ckbAddLineBreaks.change(function () {
            if ($(this).attr("checked")) {
                ckbRemoveLineBreaks.attr("checked", false);
                ckbRemoveLineBreaks.parent().children('.tf_hidden_modifier_property').hide(250);
                ckbAddLineBreaks.parent().children('.tf_hidden_modifier_property').show(250);
            } else {
                ckbAddLineBreaks.parent().children('.tf_hidden_modifier_property').hide(250);
            }
        });
        ckbRemoveLineBreaks.change(function () {
            if ($(this).attr("checked")) {
                ckbAddLineBreaks.attr("checked", false);
                ckbAddLineBreaks.parent().children('.tf_hidden_modifier_property').hide(250);
                ckbRemoveLineBreaks.parent().children('.tf_hidden_modifier_property').show(250);
            } else {
                ckbRemoveLineBreaks.parent().children('.tf_hidden_modifier_property').hide(250);
            }
        });

        //add click event for the copy to clipboard button
        $('#btnCopyToClipboard').click(function () {
            window.clipboardData.setData('Text', output.val());
        });

        //add click event for the copy to input button
        $('#btnCopyToInput').click(function () {
            input.val(output.val());
            output.val('');
            TextFormatter.slideLayout(container, modifierContainer, modifierInput, flipBackButton, false);
        });

        //add click events for the two clear fields
        $('#btnClearInputField').click(function () {
            input.val('');
        });
        $('#btnClearOutputField').click(function () {
            output.val('');
        });

        //add change event for output type ddl to show var field if stringbuilder selected
        $('#ddlOutputType').change(function () {
            if ($(this).val() == 'vbsb' || $(this).val() == 'csharp') {
                $('#divSBVarName').show(250);
            } else {
                $('#divSBVarName').hide(250);
            }
        });

        //add click events to buttons that need to slide the page left and right
        submitModifiers.click(function () {
            TextFormatter.slideLayout(container, modifierContainer, modifierOutput, flipBackButton, true);
            TextFormatter.submitModifiers(input.val(), output);
        });
        flipBackButton.click(function () {
            TextFormatter.slideLayout(container, modifierContainer, modifierInput, flipBackButton, false);
        });

        //add ctrl-enter event to submit modifier
        container.keypress(function (event) {
            if (event.which == 10) {
                if (output.is(":focus")) flipBackButton.click();
                else submitModifiers.click();
            }
        });
        
        //add character count and word count tooltip to text areas
        txtAreas.qtip({
            content: {
                text: 'Character Count: 0<br />Word Count: 0'
            },
            position: {
                target: 'mouse',
                adjust: {
                    x: 20
                }
            }
        });

        txtAreas.hover(function () {
            txtAreas.qtip('option', 'content.text', 'Character Count: ' + $(this).val().length + '<br />Word Count: ' + TextFormatter.Helpers.CountWords($(this).val().toString()));
        });
        txtAreas.keyup(function () {
            txtAreas.qtip('option', 'content.text', 'Character Count: ' + $(this).val().length + '<br />Word Count: ' + TextFormatter.Helpers.CountWords($(this).val().toString()));
        });
    },
    submitModifiers: function(input, outputField){
        var output = input;
        var selectedInput = $('#ddlInputType').val();
        var selectedOutput = $('#ddlOutputType').val();

        //do case conversion first, if needed
        if ($('#ckbToUpper').attr("checked")) {
            output = output.toUpperCase();
        }
        if ($('#ckbToLower').attr("checked")) {
            output = output.toLowerCase();
        }

        //do SB to text conversion before line breaks
        if ((selectedInput == 'csharp' && selectedOutput == 'text') ||
         (selectedInput == 'csharp' && selectedOutput == 'csharp')) {
            //SB to text conversion
            output = TextFormatter.CSharpFunctions.RemoveStringBuilder(output);
        }

        //do SB to text conversion before line breaks
        if ((selectedInput == 'vbsb' && selectedOutput == 'text') ||
         (selectedInput == 'vbsb' && selectedOutput == 'vbsb')) {
            //SB to text conversion
            output = TextFormatter.VBFunctions.RemoveStringBuilder(output);
        }

        //handle line breaks
        if ($('#ckbAddLineBreaks').attr("checked")) {
            output = TextFormatter.LineFormatting.AddLineBreaks(output, $('#txtCharsPerLine').val(), $('#txtLineBreakCharacter').val())
        } else if ($('#ckbRemoveLineBreaks').attr("checked")) {
            output = TextFormatter.LineFormatting.RemoveLineBreaks(output, $('#txtLineBreakReplacement').val())
        }

        if (selectedInput == 'sql') {
            //text to sql conversion
            output = TextFormatter.SqlFunctions.Format(TextFormatter.Helpers.CleanSpacing(output));
        }

        //do text to SB conversion after line breaks
        if ((selectedInput == 'text' && selectedOutput == 'vbsb') ||
         (selectedInput == 'vbsb' && selectedOutput == 'vbsb') ||
         (selectedInput == 'sql' && selectedOutput == 'vbsb')) {
            //text to SB conversion
            output = TextFormatter.VBFunctions.AddStringBuilder(output);
        }

        //do text to SB conversion after line breaks for C#
        if ((selectedInput == 'text' && selectedOutput == 'csharp') ||
         (selectedInput == 'csharp' && selectedOutput == 'csharp') ||
         (selectedInput == 'sql' && selectedOutput == 'csharp')) {
            //text to SB conversion
            output = TextFormatter.CSharpFunctions.AddStringBuilder(output);
        }

        //display output
        outputField.val(output);
        outputField.focus();
    },
    slideLayout: function(container, modifierContainer, modifierDestination, backButton, forward){
        if (forward) {
            container.animate({ left: '-100%' }, 400);
            backButton.show();
        } else {
            container.animate({ left: '0%' }, 400);
            backButton.hide();
        }
        modifierContainer.appendTo(modifierDestination);
    },
    LineFormatting: {
        AddLineBreaks: function (input, charactersPerLine, splitChar) {
            var i = 0;
            var j = 0;
            var endOfLineReached = false;
            var output = '';

            //loop through each character of the string
            while (i < input.length) {
                endOfLineReached = false;
                j = 0;
                //use embedded loop to create line breaks
                while (!endOfLineReached && i < input.length) {
                    //check if the current character is a newline
                    if (input.charAt(i) == '\n') {
                        endOfLineReached = true;
                        output = output + input.charAt(i)
                    } else {
                        //if we are now over the line limit, decide to break now or look for a break character
                        if (j >= (charactersPerLine - 1)) {
                            //see if a break character was passed to the function
                            if (splitChar != "") {
                                //break character passed, so we need to continue looping till we find it
                                if (input.toString().charAt(i) == splitChar) {
                                    endOfLineReached = true;
                                    output = output + input.charAt(i) + '\n';
                                } else {
                                    output = output + input.charAt(i);
                                }
                            } else {
                                //no break char needed, so break now
                                endOfLineReached = true;
                                output = output + input.charAt(i) + '\n';
                            }
                        } else {
                            //append the character and keep looping through
                            output = output + input.charAt(i)
                        }
                    }

                    //increment counters
                    j++;
                    i++;
                }
            }

            //return the new string
            return output;
        },
        RemoveLineBreaks: function (input, lineBreakReplacement) {
            var output = '';
            for (i = 0; i < input.length; i++) {
                if (input.charAt(i) != '\n') output = output + input.charAt(i);
                else output = output + lineBreakReplacement;
            }
            return output;
        }
    },
    VBFunctions: {
        AddStringBuilder: function (input) {
            //initialize the output with the definition of the string builder
            var output = '';
            var i = 0;
            var endOfLineReached = false;
            var name = '';

            //set the var name
            if ($('#txtVarName').val() != '') {
                name = $('#txtVarName').val();
            } else {
                name = '#replaceme#';
            }

            //start the next string builder line
            output = output + name + '.AppendLine("';
            while (i < input.length) {
                endOfLineReached = false;
                while (i < input.length && !endOfLineReached) {
                    if (input.charAt(i) == '\n') {
                        endOfLineReached = true;
                        output = output + '")\n' + name + '.AppendLine("';
                    } else {
                        //escape double quotes if necessary
                        if (input.charAt(i) == '"') {
                            output = output + input.charAt(i) + '"';
                        } else {
                            //append the current character
                            output = output + input.charAt(i);
                        }
                    }

                    //increment
                    i++;
                }
            }

            //complete the string builder command
            output = output + '")';

            //return the output
            return output;
        },
        RemoveStringBuilder: function (input) {
            //initialize the output with the definition of the string builder
            var output = '';
            var i = 0;
            var j = 0;
            var endOfLineReached = false;

            //start the next line
            while (i < input.length) {
                endOfLineReached = false;
                j = input.indexOf('.AppendLine("', i);

                //verify that an append was found
                if (j > 0) {
                    //if output is not empty, it needs a new line
                    if (output != '') output = output + '\n';

                    //determine if we have reached the end of the string builder section
                    j = input.indexOf('"', j);
                    i = j + 1;
                    while (i < input.length && !endOfLineReached) {
                        //look for the double quote to end the string builder line (also check for escaped double quotes)
                        if (input.charAt(i) == '"' && input.charAt(i + 1) != '"') {
                            endOfLineReached = true;
                        } else if (input.charAt(i) == '"' && input.charAt(i + 1) == '"') {
                            output = output + input.charAt(i); // + input.charAt(i + 1);
                            i = i + 1;
                        }else {
                            //append the current character
                            output = output + input.charAt(i);
                        }

                        //increment
                        i++;
                    }
                } else { i = input.length + 1; }
            }

            //return the output
            return output;
        }
    },
    CSharpFunctions: {
        AddStringBuilder: function (input) {
            //initialize the output with the definition of the string builder
            var output = '';
            var i = 0;
            var endOfLineReached = false;
            var name = '';

            //set the var name
            if ($('#txtVarName').val() != '') {
                name = $('#txtVarName').val();
            } else {
                name = '#replaceme#';
            }

            //start the next string builder line
            output = output + name + '.AppendLine("';
            while (i < input.length) {
                endOfLineReached = false;
                while (i < input.length && !endOfLineReached) {
                    if (input.charAt(i) == '\n') {
                        endOfLineReached = true;
                        output = output + '");\n' + name + '.AppendLine("';
                    } else {
                        //escape double quotes if necessary
                        if (input.charAt(i) == '"') {
                            output = output + '\\' + input.charAt(i);
                        } else {
                            //append the current character
                            output = output + input.charAt(i);
                        }
                    }

                    //increment
                    i++;
                }
            }

            //complete the string builder command
            output = output + '");';

            //return the output
            return output;
        },
        RemoveStringBuilder: function (input) {
            //initialize the output with the definition of the string builder
            var output = '';
            var i = 0;
            var j = 0;
            var endOfLineReached = false;

            //start the next line
            while (i < input.length) {
                endOfLineReached = false;
                j = input.indexOf('.AppendLine("', i);

                //verify that an append was found
                if (j > 0) {
                    //if output is not empty, it needs a new line
                    if (output != '') output = output + '\n';

                    //determine if we have reached the end of the string builder section
                    j = input.indexOf('"', j);
                    i = j + 1;
                    while (i < input.length && !endOfLineReached) {
                        //look for the double quote to end the string builder line (also check for escaped double quotes)
                        if (input.charAt(i) == '"') { // && input.charAt(i + 1) != '"') {
                            endOfLineReached = true;
                        } else if (input.charAt(i) == '\\' && input.charAt(i + 1) == '"') {
                            output = output + input.charAt(i + 1);
                            i = i + 1;
                        } else {
                            //append the current character
                            output = output + input.charAt(i);
                        }

                        //increment
                        i++;
                    }
                } else { i = input.length + 1; }
            }

            //return the output
            return output;
        }
    },
    SqlFunctions: {
        Format: function (input) {
            //initialize the output with the definition of the string builder
            var output = '';
            var compareString = input.toString().toLowerCase(); //for comparison purposes to prevent case issues
            var i = 0;
            var j = 0;
            var currentTabs = 0;
            var endOfLineReached = false;
            var indexArray = [];
            var sqlRegExp;
            var lowestIndex;
            var lastToken = '';
            var lastNonFormattingToken = '';
            var skipTabs;

            //start the next line
            while (i < input.length) {
                //carriage return keywords
                //  select, from, where, order by, group by, left outer join, left inner join,
                //  right outer join, right inner join, left join, right join, join, union, (, )
                indexArray[0] = compareString.indexOf('select', i);
                indexArray[1] = compareString.indexOf('from', i);
                indexArray[2] = compareString.indexOf('where', i);
                indexArray[3] = compareString.indexOf('order by', i);
                indexArray[4] = compareString.indexOf('group by', i);
                indexArray[5] = compareString.indexOf('left outer join', i);
                indexArray[6] = compareString.indexOf('left inner join', i);
                indexArray[7] = compareString.indexOf('right outer join', i);
                indexArray[8] = compareString.indexOf('right inner join', i);
                indexArray[9] = compareString.indexOf('left join', i);
                indexArray[10] = compareString.indexOf('right join', i);
                indexArray[11] = compareString.indexOf('join', i);
                indexArray[12] = compareString.indexOf('union', i);
                indexArray[13] = compareString.indexOf('(', i);
                indexArray[14] = compareString.indexOf(')', i);
                indexArray[15] = compareString.indexOf(',', i);
                indexArray[16] = compareString.indexOf('insert', i);
                indexArray[17] = compareString.indexOf('update', i);
                indexArray[18] = compareString.indexOf('delete', i);
                indexArray[19] = compareString.indexOf(' and ', i);
                indexArray[20] = compareString.indexOf(' or ', i);
                indexArray[21] = compareString.indexOf(' in ', i);
                indexArray[22] = compareString.indexOf('into', i);
                indexArray[23] = compareString.indexOf('values', i);
                indexArray[24] = compareString.indexOf('set', i);
                indexArray[25] = compareString.indexOf('inner join', i);
                indexArray[26] = compareString.indexOf('outer join', i);
                indexArray[27] = compareString.indexOf('=', i);
                indexArray[28] = compareString.indexOf('>', i);
                indexArray[29] = compareString.indexOf('<', i);
                indexArray[30] = compareString.indexOf('>=', i);
                indexArray[31] = compareString.indexOf('<=', i);
                indexArray[32] = compareString.indexOf('<>', i);

                //re-initialize a couple variables for the next pass
                endOfLineReached = false;
                lowestIndex = indexArray.length;
                skipTabs = false;
                
                //since items 19 - 22 had to search with a space at the beginning, their index needs to be adjusted if found
                for (n = 19; n < 22; n++) {
                    if (indexArray[n] > -1) indexArray[n]++;
                }

                //determine which index is the lowest without being negative (not found)
                for (n = 0; n < indexArray.length; n++) {
                    if (indexArray[n] >= 0 && lowestIndex == indexArray.length) {
                        //if the index is non-negative and the current lowest index is still the default
                        //new lower index found
                        lowestIndex = n;
                    } else if (indexArray[n] >= 0 && indexArray[n] < indexArray[lowestIndex]) {
                        //new lower index found
                        lowestIndex = n;
                    }
                }

                //read to the next keyword
                for (n = i; n < indexArray[lowestIndex]; n++) {
                    //if it is a space after a comma, skip it because the newline negates the need for the space
                    if (input[n] == ' ' && (output[output.length - 1] == '\n' || output[output.length - 1] == '\t') /*(lastToken == ',' || lastToken == 'from' ) && (n - i) == 1*/) {
                        continue;
                    } else {
                        output = output + input[n];
                    }
                }
                i = n;

                //check if one was found
                if (lowestIndex < indexArray.length) {
                    //a keyword found, now handle
                    switch (lowestIndex) {
                        case 0:
                            //select statement is the next token
                            lastToken = 'select';
                            lastNonFormattingToken = 'select';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            currentTabs++;
                            break;
                        case 1:
                            //from statement is the next token
                            lastToken = 'from';
                            lastNonFormattingToken = 'from';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 2:
                            //where statement is the next token
                            lastToken = 'where';
                            lastNonFormattingToken = 'where';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 3:
                            //order by statement is the next token
                            if (lastToken == ',' || lastToken == '(') {
                                output = output + input.substr(indexArray[lowestIndex], 8);
                                skipTabs = true;
                            } else {
                                lastToken = 'order by';
                                lastNonFormattingToken = 'order by';
                                output = output + '\n';
                                output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            }
                            break;
                        case 4:
                            //group by statement is the next token
                            lastToken = 'group by';
                            lastNonFormattingToken = 'group by';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 5:
                            //left outer join statement is the next token
                            lastToken = 'left outer join';
                            lastNonFormattingToken = 'left outer join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 6:
                            //left inner join statement is the next token
                            lastToken = 'left inner join';
                            lastNonFormattingToken = 'left inner join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 7:
                            //right outer join statement is the next token
                            lastToken = 'right outer join';
                            lastNonFormattingToken = 'right outer join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 8:
                            //right inner join statement is the next token
                            lastToken = 'right inner join';
                            lastNonFormattingToken = 'right inner join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 9:
                            //left join statement is the next token
                            lastToken = 'left join';
                            lastNonFormattingToken = 'left join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 10:
                            //right join statement is the next token
                            lastToken = 'right join';
                            lastNonFormattingToken = 'right join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 11:
                            //join statement is the next token
                            lastToken = 'join';
                            lastNonFormattingToken = 'join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 12:
                            //union statement is the next token
                            lastToken = 'union';
                            lastNonFormattingToken = 'union';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            skipTabs = true;
                            break;
                        case 13:
                            //( statement is the next token
                            if (lastToken == 'into') {
                                output = output + '\n';
                                output = TextFormatter.Helpers.AddTabs(output, currentTabs) + '(\n';
                                currentTabs++;
                            } else if (lastToken != 'from' && lastToken != 'in' && lastToken != 'values' && lastToken != 'set'
                                && lastToken != '=' && lastToken != '>' && lastToken != '<' && lastToken != '>=' && lastToken != '<=' && lastToken != '<>') {
                                output = output + '(';
                                skipTabs = true;
                            } else {
                                output = output + '(\n';
                                currentTabs++;
                            }
                            lastToken = '(';
                            break;
                        case 14:
                            //) statement is the next token
                            if (lastNonFormattingToken == 'into' || lastNonFormattingToken == 'values' || lastNonFormattingToken == 'in') currentTabs--;
                            if (lastToken != '(' && lastToken != ',' && lastToken != 'and' && lastToken != 'or') {
                                currentTabs = currentTabs - 2;
                            }

                            //determine if output needs a newline and tabs. if the previous paraenthesis is on the same line, do not add new line
                            if (output.lastIndexOf("(") < output.lastIndexOf("\n")) {
                                output = output + '\n';
                                output = TextFormatter.Helpers.AddTabs(output, currentTabs);
                            }

                            output = output + ')';
                            skipTabs = true;
                            lastToken = ')';
                            break;
                        case 15:
                            //, statement is the next token
                            if ((lastToken == '(' && lastNonFormattingToken != 'in') || (lastToken == ')' &&
                                !(lastNonFormattingToken == 'select' || lastNonFormattingToken == 'insert' || lastNonFormattingToken == 'from'
                                || lastNonFormattingToken == 'where' || lastNonFormattingToken == 'update' || lastNonFormattingToken == 'delete'
                                || lastNonFormattingToken == 'in' || lastNonFormattingToken == 'values' || lastNonFormattingToken == 'into'
                                || lastNonFormattingToken == 'set'))) {
                                output = output + ',';
                                skipTabs = true;
                            } else {
                                output = output + ',\n';
                            }
                            lastToken = ',';
                            break;
                        case 16:
                            //insert statement is the next token
                            lastToken = 'insert';
                            lastNonFormattingToken = 'insert';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            currentTabs++;
                            break;
                        case 17:
                            //update statement is the next token
                            lastToken = 'update';
                            lastNonFormattingToken = 'update';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            currentTabs++;
                            break;
                        case 18:
                            //delete statement is the next token
                            lastToken = 'delete';
                            lastNonFormattingToken = 'delete';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            currentTabs++;
                            break;
                        case 19:
                            //and statement is the next token
                            lastToken = 'and';
                            lastNonFormattingToken = 'and';
                            output = output + '\n'
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 20:
                            //or statement is the next token
                            lastToken = 'or';
                            lastNonFormattingToken = 'or';
                            output = output + '\n'
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length);
                            skipTabs = true;
                            break;
                        case 21:
                            //in statement is the next token
                            lastToken = 'in';
                            lastNonFormattingToken = 'in';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 22:
                            //into statement is the next token
                            lastToken = 'into';
                            lastNonFormattingToken = 'into';
                            output = output + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 23:
                            //values statement is the next token
                            lastToken = 'values';
                            lastNonFormattingToken = 'values';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            break;
                        case 24:
                            //set statement is the next token
                            lastToken = 'set';
                            lastNonFormattingToken = 'set';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], lastToken.length) + '\n';
                            skipTabs = true;
                            break;
                        case 25:
                            //inner join statement is the next token
                            lastToken = 'inner join';
                            lastNonFormattingToken = 'inner join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + lastToken;
                            skipTabs = true;
                            break;
                        case 26:
                            //outer join statement is the next token
                            lastToken = 'outer join';
                            lastNonFormattingToken = 'outer join';
                            output = output + '\n';
                            output = TextFormatter.Helpers.AddTabs(output, currentTabs) + lastToken;
                            skipTabs = true;
                            break;
                        case 27:
                            //= is the next token
                            lastToken = '=';
                            lastNonFormattingToken = '=';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                        case 28:
                            //> is the next token
                            lastToken = '>';
                            lastNonFormattingToken = '>';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                        case 29:
                            //< is the next token
                            lastToken = '<';
                            lastNonFormattingToken = '<';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                        case 30:
                            //>= is the next token
                            lastToken = '>=';
                            lastNonFormattingToken = '>=';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                        case 31:
                            //<= is the next token
                            lastToken = '<=';
                            lastNonFormattingToken = '<=';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                        case 32:
                            //<> is the next token
                            lastToken = '<>';
                            lastNonFormattingToken = '<>';
                            output = output + lastToken;
                            skipTabs = true;
                            break;
                    }
                    i = i + lastToken.length;

                    //add tabs
                    if (!skipTabs) {
                        output = TextFormatter.Helpers.AddTabs(output, currentTabs);
                    }
                } else {
                    //no more keywords found; read to the end
                    for (n = i; n < input.length; n++) {
                        output = output + input[n];
                    }
                    i = n;
                }
            }

            //return the output
            return output;
        }
    },
    Helpers: {
        //remove new lines and tabs
        CleanSpacing: function(input) {
            var exp = /(\n|\t)/g
            var output = input.toString().replace(exp, " ");

            //now replace any occurances of multiple spaces with a single space
            exp = /(\s+)/g
            return output.toString().replace(exp, " ");
        },        
        AddTabs: function(input, numberOfTabs) {
            var output = input;
            for (n = 0; n < numberOfTabs; n++) {
                output = output + '\t';
            }
            return output;
    },
        CountWords: function (input) {
            var count = 0;
            if(input.length > 0){
                var lines = input.split('\n');
                for(i=0; i<lines.length; i++){
                    count += lines[i].split(' ').length;
                }
            }
            return count;
        }
    }
}