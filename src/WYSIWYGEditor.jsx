import React, { useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function WYSIWYGEditor() {
  const editorRef = useRef(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [value, setValue] = useState("");
  const [savedRange, setSavedRange] = useState(null); // ✅ keep track of caret

  const handleKeyDown = (e) => {
    if (e.key === "@") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSavedRange(range.cloneRange()); // ✅ save caret position
      setSuggestionOpen(true);
      setSuggestionPosition({ x: rect.left, y: rect.bottom });
    } else {
      setSuggestionOpen(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const fields = [
    { id: "product-id", name: "Product ID", type: "default" },
    { id: "producer-name", name: "Producer Name", type: "default" },
    { id: "policy-number", name: "Policy Number", type: "default" },
    { id: "agency-id", name: "Agency ID", type: "default" },
    { id: "agency-name", name: "Agency Name", type: "default" },
    { id: "carrier-abbreviation", name: "Carrier Abbreviation", type: "carrier" },
  ];

  const filteredFields = fields.filter((field) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOnInput = (e) => {
    console.log("Content changed:", e.target.innerHTML);
  };

  const insertField = (field) => {
  const editor = editorRef.current;
  if (!savedRange) return;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedRange);

  let range = selection.getRangeAt(0);

  // 🔑 Move range back one character to also cover "@"
  range.setStart(range.startContainer, range.startOffset - 1);

  // Replace "@" with the selected field span
  const span = document.createElement("span");
  span.style.color = "green";
  span.contentEditable = "false";
  span.innerText = field.name;

  range.deleteContents();
  range.insertNode(span);

  // Move cursor after the span
  range.setStartAfter(span);
  range.setEndAfter(span);
  selection.removeAllRanges();
  selection.addRange(range);

  setValue(editor.innerHTML);
  setSuggestionOpen(false);
};


  return (
    <div>
      {suggestionOpen && (
        <div
          style={{
            position: "absolute",
            top: suggestionPosition.y,
            left: suggestionPosition.x,
          }}
        >
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Fields</h2>
              <button
                onClick={() => setSuggestionOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Fields"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Fields List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredFields.map((field) => (
                <div
                  onClick={() => insertField(field)}
                  key={field.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-gray-900 font-medium">{field.name}</span>
                </div>
              ))}

              {filteredFields.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No fields found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={true}
        onKeyDown={handleKeyDown}
        onInput={(e) => handleOnInput(e)}
        style={{
          border: "1px solid #ccc",
          minHeight: "100px",
          padding: "10px",
        }}
      >
        <span style={{ color: "blue" }} contentEditable={false}>
          Paresh
        </span>
        <span> </span>
        <span style={{ color: "green" }} contentEditable={false}>
          Chaudhary
        </span>
      </div>
    </div>
  );
}
