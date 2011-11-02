/// <reference path="jquery-1.6.4.js" />
/// <reference path="jquery-1.6-vsdoc.js" />
$(document).ready(function () {
    //initial hide
    $('.tf_hidden_modifier_property').hide();
    $('#divSBVarName').hide();

    //add checked event for check boxes
    $('#ckbAddLineBreaks').change(function () {
        if ($(this).attr("checked")) {
            $('.tf_hidden_modifier_property').show(250);
            $('#ckbRemoveLineBreaks').attr("checked", false);
        } else {
            $('.tf_hidden_modifier_property').hide(250);
        }
    });
    $('#ckbRemoveLineBreaks').change(function () {
        if ($(this).attr("checked")) {
            $('#ckbAddLineBreaks').attr("checked", false);
            $('.tf_hidden_modifier_property').hide(250);
        }
    });

    //add click event for the copy to clipboard button
    $('#btnCopyToClipboard').click(function () {
        window.clipboardData.setData('Text', $('#txtOutput').val());
    });

    //add click event for the copy to input button
    $('#btnCopyToInput').click(function () {
        $('#txtInput').val($('#txtOutput').val());
        $('#txtOutput').val('');
    });

    //add click events for the two clear fields
    $('#btnClearInputField').click(function () {
        $('#txtInput').val('');
    });
    $('#btnClearOutputField').click(function () {
        $('#txtOutput').val('');
    });

    //add click event for the submit button
    $('#btnSubmitModifiers').click(function () {
        SubmitModifiers($('#txtInput').val(), $('#txtOutput'));
    });

    //add change event for output type ddl to show var field if stringbuilder selected
    $('#ddlOutputType').change(function () {
        if ($(this).val() == 'vbsb' || $(this).val() == 'csharp') {
            $('#divSBVarName').show(250);
        } else {
            $('#divSBVarName').hide(250);
        }
    });

    var isLeft = true;
    var container = $('#tf');
    //var left = $('#switchLeft');
    //var right = $('#switchRight');
    //var leftContainer = $('#tf_modifier_left');
    //var rightContainer = $('#tf_modifier_right');
    //rightContainer.hide();
    //left.click(function () {
    //    container.animate({ left: '-72%' }, 400);
    //    rightContainer.show();
    //    leftContainer.hide();
    //});
    //right.click(function () {
    //    container.animate({ left: '0%' }, 400);
    //    rightContainer.hide();
    //    leftContainer.show();
    //});
    $('#btnSubmitModifiers').click(function () {
        container.animate({ left: '-100%' }, 400);
        $('#tf_modifier_container').appendTo($('#tf_modifier_output'));
    });

});

function SubmitModifiers(input, outputField) {
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
    if ((selectedInput == 'vbsb' && selectedOutput == 'text') ||
         (selectedInput == 'vbsb' && selectedOutput == 'vbsb') ) {
        //SB to text conversion
        output = RemoveVBStringBuilder(output);
    }
    
    //handle line breaks
    if($('#ckbAddLineBreaks').attr("checked")){
        output = AddLineBreaks(output, $('#txtCharsPerLine').val(), $('#txtLineBreakCharacter').val())
    } else if ($('#ckbRemoveLineBreaks').attr("checked")) {
        output = RemoveLineBreaks(output)
    }
    
    if (selectedInput == 'sql') {
        //text to sql conversion
        output = FormatSQL(CleanSpacing(output));
    }
    
    //do text to SB conversion after line breaks
    if ((selectedInput == 'text' && selectedOutput == 'vbsb') ||
         (selectedInput == 'vbsb' && selectedOutput == 'vbsb') ||
         (selectedInput == 'sql' && selectedOutput == 'vbsb')) {
        //text to SB conversion
        output = AddVBStringBuilder(output);
    }

    //do text to SB conversion after line breaks for C#
    if ((selectedInput == 'text' && selectedOutput == 'csharp') ||
         (selectedInput == 'csharp' && selectedOutput == 'csharp') ||
         (selectedInput == 'sql' && selectedOutput == 'csharp')) {
        //text to SB conversion
        output = AddCSharpStringBuilder(output);
    }


    //do SB to text conversion before line breaks
    if ((selectedInput == 'csharp' && selectedOutput == 'text') ||
         (selectedInput == 'csharp' && selectedOutput == 'csharp')) {
        //SB to text conversion
        output = RemoveCSharpStringBuilder(output);
    }   
    
    //display output    
    $(outputField).val(output);
}

function AddLineBreaks(input, charactersPerLine, splitChar) {
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
}

function RemoveLineBreaks(input) {
    var output = '';

    for (i = 0; i < input.length; i++) {
        if (input.charAt(i) != '\n') output = output + input.charAt(i);
    }

    return output;
}

function AddVBStringBuilder(input) {
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
                if(input.charAt(i) == '"'){
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
}

function RemoveVBStringBuilder(input) {
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
                if (input.charAt(i) == '"' && input.charAt(i+1) != '"' ) {
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

function AddCSharpStringBuilder(input) {
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
}

function RemoveCSharpStringBuilder(input) {
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

function FormatSQL(input) {
    //initialize the output with the definition of the string builder
    var output = '';
    var compareString = input.toString().toLowerCase(); //for comparison purposes to prevent case issues
    var i = 0;
    var j = 0;
    var currentTabs = 0;
    var endOfLineReached = false;
    var indexArray = [];
    var sqlRegExp;
    var numberOfKeywords = 25;
    var lowestIndex;
    var lastToken = '';
    var lastNonFormattingToken = '';
    var skipTabs;

    //start the next line
    while (i < input.length) {
        //re-initialize a couple variables for the next pass
        endOfLineReached = false;
        lowestIndex = numberOfKeywords;
        skipTabs = false;

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

        //since items 19 - 22 had to search with a space at the beginning, their index needs to be adjusted if found
        for (n = 19; n < 22; n++) {
            if (indexArray[n] > -1) indexArray[n]++;
        }

        //determine which index is the lowest without being negative (not found)
        for (n = 0; n < numberOfKeywords; n++) {
            if (indexArray[n] >= 0 && lowestIndex == numberOfKeywords) {
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
        if (lowestIndex < numberOfKeywords) {
            //a keyword found, now handle
            switch (lowestIndex) {
                case 0:
                    //select statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 6) + '\n';
                    i = i + 6;
                    currentTabs++;
                    lastToken = 'select';
                    lastNonFormattingToken = 'select';
                    break;
                case 1:
                    //from statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], 4) + '\n';
                    i = i + 4;
                    lastToken = 'from';
                    lastNonFormattingToken = 'from';
                    break;
                case 2:
                    //where statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], 5) + '\n';
                    i = i + 5;
                    lastToken = 'where';
                    lastNonFormattingToken = 'where';
                    break;
                case 3:
                    //order by statement is the next token
                    if (lastToken == ',' || lastToken == '(') {
                        output = output + input.substr(indexArray[lowestIndex], 8);
                        skipTabs = true;
                        i = i + 8;
                    } else {
                        output = output + '\n';
                        output = AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], 8) + '\n';
                        lastToken = 'order by';
                        lastNonFormattingToken = 'order by';
                        i = i + 8;
                    }
                    break;
                case 4:
                    //group by statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], 8) + '\n';
                    i = i + 8;
                    lastToken = 'group by';
                    lastNonFormattingToken = 'group by';
                    break;
                case 5:
                    //left outer join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 15);
                    i = i + 15;
                    skipTabs = true;
                    lastToken = 'left outer join';
                    lastNonFormattingToken = 'left outer join';
                    break;
                case 6:
                    //left inner join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 15);
                    i = i + 15;
                    skipTabs = true;
                    lastToken = 'left inner join';
                    lastNonFormattingToken = 'left inner join';
                    break;
                case 7:
                    //right outer join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 16);
                    i = i + 16;
                    skipTabs = true;
                    lastToken = 'right outer join';
                    lastNonFormattingToken = 'right outer join';
                    break;
                case 8:
                    //right inner join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 16);
                    i = i + 16;
                    skipTabs = true;
                    lastToken = 'right inner join';
                    lastNonFormattingToken = 'right inner join';
                    break;
                case 9:
                    //left join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 9); 
                    i = i + 9;
                    skipTabs = true;
                    lastToken = 'left join';
                    lastNonFormattingToken = 'left join';
                    break;
                case 10:
                    //right join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 10);
                    i = i + 10;
                    skipTabs = true;
                    lastToken = 'right join';
                    lastNonFormattingToken = 'right join';
                    break;
                case 11:
                    //join statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 4);
                    i = i + 4;
                    skipTabs = true;
                    lastToken = 'join';
                    lastNonFormattingToken = 'join';
                    break;
                case 12:
                    //union statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs-1) + input.substr(indexArray[lowestIndex], 5) + '\n';
                    i = i + 5;
                    skipTabs = true;
                    lastToken = 'union';
                    lastNonFormattingToken = 'union';
                    break;
                case 13:
                    //( statement is the next token
                    if (lastToken == 'into') {
                        output = output + '\n'; 
                        output = AddTabs(output, currentTabs) + '(\n';
                        currentTabs++;
                    } else if (lastToken != 'from' && lastToken != 'in' && lastToken != 'values' && lastToken != 'set') {
                        output = output + '(';
                        skipTabs = true;
                    } else {
                        output = output + '(\n';
                        currentTabs++;
                    }
                    lastToken = '(';
                    i++;
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
                        output = AddTabs(output, currentTabs);
                    }

                    output = output + ')';
                    skipTabs = true;
                    lastToken = ')';
                    i++;
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
                    i++;
                    break;
                case 16:
                    //insert statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 6);
                    i = i + 6;
                    skipTabs = true;
                    currentTabs++;
                    lastToken = 'insert';
                    lastNonFormattingToken = 'insert';
                    break;
                case 17:
                    //update statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 6);
                    i = i + 6;
                    skipTabs = true;
                    currentTabs++;
                    lastToken = 'update';
                    lastNonFormattingToken = 'update';
                    break;
                case 18:
                    //delete statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 6) + '\n';
                    i = i + 6;
                    currentTabs++;
                    lastToken = 'delete';
                    lastNonFormattingToken = 'delete';
                    break;
                case 19:
                    //and statement is the next token
                    output = output + '\n'
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 3);
                    i = i + 3;
                    skipTabs = true;
                    lastToken = 'and';
                    lastNonFormattingToken = 'and';
                    break;
                case 20:
                    //or statement is the next token
                    output = output + '\n'
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 2);
                    i = i + 2;
                    skipTabs = true;
                    lastToken = 'or';
                    lastNonFormattingToken = 'or';
                    break;
                case 21:
                    //in statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 2) + '\n';
                    i = i + 2;
                    lastToken = 'in';
                    lastNonFormattingToken = 'in';
                    break;
                case 22:
                    //into statement is the next token
                    output = output + input.substr(indexArray[lowestIndex], 4) + '\n';
                    i = i + 4;
                    lastToken = 'into';
                    lastNonFormattingToken = 'into';
                    break;
                case 23:
                    //values statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs) + input.substr(indexArray[lowestIndex], 6) + '\n';
                    i = i + 6;
                    lastToken = 'values';
                    lastNonFormattingToken = 'values';
                    break;
                case 24:
                    //set statement is the next token
                    output = output + '\n';
                    output = AddTabs(output, currentTabs - 1) + input.substr(indexArray[lowestIndex], 3) + '\n';
                    i = i + 3;
                    skipTabs = true;
                    lastToken = 'set';
                    lastNonFormattingToken = 'set';
                    break;
            }

            //add tabs
            if (!skipTabs) {
                output = AddTabs(output, currentTabs);
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

function AddTabs(input, numberOfTabs) {
    var output = input;
    for (n = 0; n < numberOfTabs; n++) {
        output = output + '\t';
    }
    return output;
}

//remove new lines and tabs
function CleanSpacing(input) {
    var exp = /(\n|\t)/g
    var output = input.toString().replace(exp, " ");

    //now replace any occurances of multiple spaces with a single space
    exp = /(\s+)/g
    return output.toString().replace(exp, " ");
}
