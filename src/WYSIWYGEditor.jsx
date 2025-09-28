import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import "./mention.css";
import ReactDOM from "react-dom/client";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import amsIcon from "./ams.svg";
import fieldData from "./fieldData";

export default function WYSIWYGEditor() {
  const editorRef = useRef(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ left: 0, top: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [savedRange, setSavedRange] = useState(null);
  const [atSignRange, setAtSignRange] = useState(null); // Store the @ character range specifically
  const [highlightIndex, setHighlightIndex] = useState(0);
  const itemRefs = useRef([]);
  const suggestionRef = useRef(null);
  const [value,setValue] = useState("set demo @@agencyID@@ is demo @@commissionPerc@@ but this is wrong $$Eff Date$$ demo $$CarrierAbbrev$$ it demo for @@vendorID@@");
  // const [value,setValue] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const TRIGGER_CHARS = ["@", "/"];


    // Map field -> description , type
  const descAndTypeByField = useMemo(() => {
    const m = new Map();
    fieldData.forEach((f) =>
      m.set(f.fieldName, {desc : f?.description || '' , type: f?.type || ""})
    );
    return m;
  }, [fieldData]);

  useEffect(() => {
    if (suggestionOpen) {
      setHighlightIndex(0);
      // setTimeout(() => {
      //   const firstItem = document.querySelector(".suggestion-item");
      //   if (firstItem) {
      //     firstItem.focus();
      //   }
      // }, 0); // slight delay ensures DOM is painted
    }
    function handleClickOutside(event) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setSuggestionOpen(false);
      }
    }

    if (suggestionOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionOpen]);

  useEffect(() => {
  if (editorRef.current && !isInitialized) {
    // const fieldsMap = Object.fromEntries(fields.map(f => [f.displayName, f]));

    const elements = parseWithMentions(value);

    // Instead of innerHTML, render directly into the editor
    ReactDOM.createRoot(editorRef.current).render(<>{elements}</>);

    setTimeout(() => {
      setCursorToEnd();
      setIsInitialized(true);
    }, 0);
  }
}, [isInitialized]);


  useEffect(() => {
    if (suggestionOpen && itemRefs.current[highlightIndex]) {
      itemRefs.current[highlightIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightIndex, suggestionOpen]);

  const handleKeyDown = (e) => {
    if (TRIGGER_CHARS.includes(e.key)) {
      // Let the @ character be inserted first
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create a range that includes the @ character
        const atRange = range.cloneRange();
        atRange.setStart(range.startContainer, range.startOffset - 1);
        atRange.setEnd(range.startContainer, range.startOffset);

        setAtSignRange(atRange);
        setSavedRange(range.cloneRange());
        setSuggestionOpen(true);
        
        // current position of cursor
        const cursorPos = { top: rect.top + window.scrollY, left: rect.left };
        const { top, left } = calculateDropdownPosition(cursorPos);
        setSuggestionPosition({
          left,
          top,
        });
        setSearchTerm(""); // Reset search term
      }, 0);
    } else if (e.key === "Escape") {
      setSuggestionOpen(false);
    } else if (suggestionOpen && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      // Typing while suggestion box is open → update searchTerm only
      e.preventDefault();
      setSearchTerm((prev) => prev + e.key);
    } else if (e.key === "ArrowDown" && suggestionOpen) {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredFields.length);
    } else if (e.key === "ArrowUp" && suggestionOpen) {
      e.preventDefault();
      setHighlightIndex(
        (prev) => (prev - 1 + filteredFields.length) % filteredFields.length
      );
    } else if (e.key === "Enter" && suggestionOpen) {
      e.preventDefault();
      if (filteredFields[highlightIndex]) {
        insertField(filteredFields[highlightIndex]);
        setSuggestionOpen(false);
        const selectedField = filteredFields[highlightIndex];
        // appendFieldManually(selectedField);
      }
    }else if(e.key == "Enter" && !suggestionOpen){
       e.preventDefault();

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      // delete any selection contents (if any)
      range.deleteContents();

      // create and insert <br>
      const br = document.createElement("br");
      range.insertNode(br);

      // insert an invisible text node after <br> so caret can be placed
      const zw = document.createTextNode("\u200B");
      br.parentNode.insertBefore(zw, br.nextSibling);

      // move caret inside the zero-width text node (start)
      const newRange = document.createRange();
      newRange.setStart(zw, 0);
      newRange.setEnd(zw, 0);

      sel.removeAllRanges();
      sel.addRange(newRange);

      editorRef.current.focus();

      setValue(JSON.stringify(convertEditorContentToPlain(editorRef.current.innerHTML)));
}
  };


  const filteredFields = fieldData.filter((field) =>
    field.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOnInput = (e) => {
    // If suggestions are open and user is typing after @
    if (suggestionOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = editorRef.current.textContent;

        // Find the @ character before current position
        let currentPos = 0;
        let walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          if (node === range.startContainer) {
            currentPos += range.startOffset;
            break;
          } else {
            currentPos += node.textContent.length;
          }
        }

        // Look for @ before current position
        let atIndex = -1;
        for (let i = currentPos - 1; i >= 0; i--) {
          const char = textContent[i];
          if (TRIGGER_CHARS.includes(char)) {
            atIndex = i;
            break;
          }
          if (char === " " || char === "\n") {
            break; // Stop searching if we hit whitespace
          }
        }

        if (atIndex !== -1) {
          const searchText = textContent.substring(atIndex + 1, currentPos);
          setSearchTerm(searchText);
        } else {
          setSuggestionOpen(false);
        }
      }
      // editorRef.current.innerHTML = editorRef.current.innerHTML.substring(0 , editorRef.current.innerHTML.length -1);;
      // 
    }else{
      setValue(JSON.stringify(convertEditorContentToPlain(editorRef.current.innerHTML)));
    }
  };
 

function convertEditorContentToPlain(text) {
    // Parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Replace all mention spans with @@...@@
    doc.querySelectorAll(".mention-span").forEach(span => {
      const innerText = span.getAttribute("data-field-name") || span.querySelector("span")?.textContent || "";
      let prefix =span.getAttribute("data-field-type") == "CC" ? "@@" : "$$";

      let replacement = `${prefix}${innerText}${prefix}`;
      span.replaceWith(replacement);
    });

    return doc.body.innerHTML
      .replace(/<div[^>]*>/g, "\n")
      .replace(/<\/div>/g, "")
      .replace(/<br\s*\/?>/g, "\n")      // remove <br>
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\\n/g, "\n")  // convert \n to actual newline
      .trim();

}

  // Calculate dropdown position
const calculateDropdownPosition = (cursorPos) => {
    const dropdownWidth = 250;

    let { top, left } = cursorPos;

    //right overflow stop
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - 10; // 10px padding from edge
      top = top + 10; // adjust top slightly if needed
    }

    return { top, left };
  };

const insertField = (field) => {
  if (!atSignRange || !savedRange) {
    setSuggestionOpen(false);
    return;
  }

  try {
    // Create a container span for the React component
    const span = document.createElement("span");
    span.contentEditable = "false";
    span.className = "mention-span";
    span.setAttribute("data-field-type", field.type);
    span.setAttribute("data-field-name",field.fieldName);

    // Render Tooltip + field UI inside the span
    ReactDOM.createRoot(span).render(
      <Tooltip title={field?.description ? field.description : null} arrow>
        <span className="cursor-pointer" >
          <img
            src={field.type === "CC" ?  "./Carrier_Connect.png" : amsIcon}
            alt={field.displayName}
            draggable={false}
          />
          <p>{field.displayName}</p>
        </span>
      </Tooltip>
    );

    // Get current selection
    const selection = window.getSelection();
    selection.removeAllRanges();

    // Find and replace everything from @ to current cursor position
    const currentRange = document.createRange();
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let atNode = null;
    let atOffset = -1;

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      // const atIndex = text.lastIndexOf("@");
      const triggerIndex = Math.max(text.lastIndexOf("@"), text.lastIndexOf("/"));

      if (triggerIndex !== -1) {
        atNode = node;
        atOffset = triggerIndex;
        break;
      }
    }

    if (atNode && atOffset !== -1) {
      // Create range from @ to current cursor position
      currentRange.setStart(atNode, atOffset);

      const currentSelection = window.getSelection();
      if (currentSelection.rangeCount > 0) {
        const cursorRange = currentSelection.getRangeAt(0);
        currentRange.setEnd(cursorRange.startContainer, cursorRange.startOffset);
      } else {
        currentRange.setEnd(atNode, atOffset + 1);
      }

      // Delete the selected content (@ and any typed text)
      currentRange.deleteContents();

      // Insert the tooltip-enabled span
      currentRange.insertNode(span);

      // Position cursor after the span
      currentRange.setStartAfter(span);
      currentRange.setEndAfter(span);
      selection.removeAllRanges();
      selection.addRange(currentRange);

      // Add a space after the field
      const spaceNode = document.createTextNode("\u00A0");
      currentRange.insertNode(spaceNode);
      currentRange.setStartAfter(spaceNode);
      currentRange.setEndAfter(spaceNode);
      selection.removeAllRanges();
      selection.addRange(currentRange);
    }

    setSuggestionOpen(false);
    setAtSignRange(null);
    setSavedRange(null);

    // Focus back to editor
    editorRef.current.focus();

     // get Current value and update state
    const newValue = convertEditorContentToPlain(editorRef.current.innerHTML);
    updatePromptMenully(newValue);
  } catch (error) {
    console.error("Error inserting field:", error);
    setSuggestionOpen(false);
  }
};

// get field name form @@field@@ or $$field$$
const abstactFieldName = (field) =>{
  if(!field) return null;
  if(field.startsWith("@@") && field.endsWith("@@")){
    const data = field.split("@@");
    if(data.length < 2) return null;
    return data[1];
  }else if(field.startsWith("$$") && field.endsWith("$$")){
    const data = field.split("$$");
    if(data.length < 2) return null;
    return data[1];
  }

  return null;
}

function parseWithMentions(text) {
  // text = text.replace("</div>","");
  const parts = text.split(/(@@.*?@@|\$\$.*?\$\$)/g);



  return parts.map((part, index) => {
    if ((part.startsWith("@@") && part.endsWith("@@") ) || (part.startsWith("$$") && part.endsWith("$$"))) {
      let fieldName = abstactFieldName(part);

      const {type , desc} = descAndTypeByField.get(fieldName);
      return (
        <span contentEditable={false}  className="mention-span">
          <Tooltip
            key={index}
            title={desc || ""}
            arrow
          >
            <span>
              <img
                src= {type === "CC" ?  "./Carrier_Connect.png" : amsIcon}
                alt={fieldName}
                draggable={false}
              />
              <p>{fieldName}</p>
            </span>
          </Tooltip>
        </span>
       
      );
    }

    return part;
  });
}

// add menully field
const updatePromptMenully = (newPrompt) => {
  setValue(JSON.stringify(newPrompt));
}

console.log(value);

  return (
    <div className="p-4">
      {suggestionOpen && (
        <div
          style={{
            position: "fixed",
            top: suggestionPosition.top + 10,
            left: suggestionPosition.left,
            zIndex: 1000,
          }}
          ref={suggestionRef}
          className=""
        >
          <div className="bg-white rounded-lg  w-[250px] max-h-[390px] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3  rounded-lg">
              <h2 className="text-sm font-semibold text-gray-900">
                Available Fields
              </h2>
              <button
                onClick={() => setSuggestionOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b p-3 pt-0 border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Fields List */}
            <div className="max-h-64 overflow-y-auto ">
              {filteredFields.map((field, idx) => (
                <div
                  onClick={() => {
                    // appendFieldManually(field);
                    insertField(field);
                  }}
                  tabIndex={0} // Make div focusable
                  ref={(el) => (itemRefs.current[idx] = el)}
                  key={field.id}
                  className={`suggestion-item flex p-3 py-1 items-center gap-3  cursor-pointer transition-colors   ${
                    idx === highlightIndex
                      ? "bg-[#f5f5f5]"
                      : "hover:bg-[#f5f5f5] focus:bg-[#f5f5f5]"
                  }`}
                  // className="suggestion-item flex items-center gap-3 p-3 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                 <img src={field.type === "CC" ?  "./Carrier_Connect.png" : amsIcon} height={20} width={20}/>
                  <div className="flex-1">
                    <span className="text-sm text-[#000000] ">
                      {field.displayName}
                    </span>
                  </div>

                </div>
              ))}

              {filteredFields.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No fields found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2">
          WYSIWYG Editor with Field Insertion
        </h1>
        <p className="text-sm text-gray-600">
          Type "@" to insert a field. Use ↑/↓ arrows to navigate, Enter to
          select, Escape to close.
        </p>
      </div>

      <style>
        {`
    [contenteditable][data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af; /* Tailwind gray-400 */
      pointer-events: none;
      display: block;
    }
  `}
      </style>
      <div
        ref={editorRef}
        contentEditable={true}
        onKeyDown={handleKeyDown}
        onInput={handleOnInput}
        data-placeholder="Type @ to insert a field..."
        className="border border-gray-300 rounded-lg p-4 text-base min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      ></div>
    </div>
  );
}

