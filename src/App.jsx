import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Search, Upload, Wand2, TestTube, Trash2, Save } from 'lucide-react';

const TransformAIPromptUI = () => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [currentTrigger, setCurrentTrigger] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [triggerStartIndex, setTriggerStartIndex] = useState(-1);
  
  const editableRef = useRef(null);
  const suggestionRef = useRef(null);

  // Available fields and commands
  const fields = [
    { id: 1, name: 'Product ID', icon: '🏷️', type: 'field' },
    { id: 2, name: 'Producer Name', icon: '🏢', type: 'field' },
    { id: 3, name: 'Policy Number', icon: '📋', type: 'field' },
    { id: 4, name: 'Agency ID', icon: '🏛️', type: 'field' },
    { id: 5, name: 'Agency Name', icon: '🏢', type: 'field' },
    { id: 6, name: 'Carrier Abbreviation', icon: '📦', type: 'field' },
    { id: 7, name: 'Alt Policy Number', icon: '📄', type: 'field' },
    { id: 8, name: 'Customer Name', icon: '👤', type: 'field' },
    { id: 9, name: 'Email Address', icon: '📧', type: 'field' },
    { id: 10, name: 'Phone Number', icon: '📞', type: 'field' },
  ];

  const commands = [
    { id: 1, name: 'Transform', icon: '🔄', type: 'command', description: 'Convert data format' },
    { id: 2, name: 'Validate', icon: '✅', type: 'command', description: 'Check data integrity' },
    { id: 3, name: 'Format', icon: '📝', type: 'command', description: 'Apply formatting rules' },
    { id: 4, name: 'Extract', icon: '📤', type: 'command', description: 'Pull specific data' },
    { id: 5, name: 'Combine', icon: '🔗', type: 'command', description: 'Merge multiple fields' },
    { id: 6, name: 'Calculate', icon: '🧮', type: 'command', description: 'Perform calculations' },
  ];

  const getFilteredSuggestions = () => {
    const suggestions = currentTrigger === '@' ? fields : commands;
    if (!currentSearch) return suggestions;
    
    return suggestions.filter(item => 
      item.name.toLowerCase().includes(currentSearch.toLowerCase())
    );
  };

  const getCursorPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return { top: 0, left: 0 };
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = editableRef.current.getBoundingClientRect();
    
    return {
      top: rect.bottom - containerRect.top,
      left: rect.left - containerRect.left
    };
  };

  const getPlainText = () => {
    if (!editableRef.current) return '';
    return editableRef.current.innerText || '';
  };

  const getCursorOffset = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  const handleInput = () => {
    const text = getPlainText();
    const cursorPosition = getCursorOffset();

    console.log('Current Text:', text);
    console.log('Cursor Position:', cursorPosition);
    
    let triggerStart = -1;
    let trigger = '';
    let searchText = '';
    
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i];
      
      if (char === '@' || char === '/') {
        triggerStart = i;
        trigger = char;
        searchText = text.substring(i + 1, cursorPosition);
        break;
      }
      
      if (char === ' ' || char === '\n' || char === '\t') {
        break;
      }
    }
    
    if (triggerStart !== -1) {
      setCurrentTrigger(trigger);
      setCurrentSearch(searchText);
      setTriggerStartIndex(triggerStart);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(0);
      
      setTimeout(() => {
        const position = getCursorPosition();
        setSuggestionPosition(position);
      }, 10);
    } else {
      setShowSuggestions(false);
      setCurrentTrigger('');
      setCurrentSearch('');
      setTriggerStartIndex(-1);
    }
  };

  const insertSuggestion = (item) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    let currentOffset = range.startOffset;
    let triggerStartOffset = 0;
    let found = false;
    
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.textContent;
      for (let i = currentOffset - 1; i >= 0; i--) {
        if (text[i] === '@' || text[i] === '/') {
          triggerStartOffset = i;
          found = true;
          break;
        }
        if (text[i] === ' ' || text[i] === '\n') break;
      }
    }
    
    if (!found) return;
    
    const suggestionSpan = document.createElement('span');
    suggestionSpan.contentEditable = false;
    suggestionSpan.className = item.type === 'field' ? 'field-tag' : 'command-tag';
    suggestionSpan.setAttribute('data-id', item.id);
    suggestionSpan.setAttribute('data-name', item.name);
    suggestionSpan.setAttribute('data-type', item.type);
    
    const baseStyle = `
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
      margin: 0 2px;
      display: inline-block;
      user-select: none;
      font-size: 14px;
    `;
    
    if (item.type === 'field') {
      suggestionSpan.style.cssText = baseStyle + `
        background-color: #dbeafe;
        color: #1e40af;
        border: 1px solid #bfdbfe;
      `;
      suggestionSpan.textContent = `${item.icon} ${item.name}`;
    } else {
      suggestionSpan.style.cssText = baseStyle + `
        background-color: #f3e8ff;
        color: #7c3aed;
        border: 1px solid #d8b4fe;
      `;
      suggestionSpan.textContent = `${item.icon} ${item.name}`;
    }
    
    const textNode = currentNode;
    const beforeText = textNode.textContent.substring(0, triggerStartOffset);
    const afterText = textNode.textContent.substring(currentOffset);
    
    const beforeTextNode = document.createTextNode(beforeText);
    const afterTextNode = document.createTextNode(' ' + afterText);
    
    const parent = textNode.parentNode;
    parent.insertBefore(beforeTextNode, textNode);
    parent.insertBefore(suggestionSpan, textNode);
    parent.insertBefore(afterTextNode, textNode);
    parent.removeChild(textNode);
    
    const newRange = document.createRange();
    newRange.setStart(afterTextNode, 1);
    newRange.setEnd(afterTextNode, 1);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    setShowSuggestions(false);
    editableRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      const filteredSuggestions = getFilteredSuggestions();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredSuggestions[selectedSuggestionIndex]) {
          insertSuggestion(filteredSuggestions[selectedSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }

    // 🟢 Handle removing tags with Backspace/Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        if (node.nodeType === Node.TEXT_NODE) {
          if (range.startOffset === 0 && node.previousSibling) {
            if (node.previousSibling.classList?.contains("field-tag") ||
                node.previousSibling.classList?.contains("command-tag")) {
              e.preventDefault();
              node.previousSibling.remove();
            }
          }
        } else if (node.classList?.contains("field-tag") || node.classList?.contains("command-tag")) {
          e.preventDefault();
          node.remove();
        }
      }
    }
  };

  const openFieldsSuggestions = () => {
    setCurrentTrigger('@');
    setCurrentSearch('');
    setShowSuggestions(true);
    setSelectedSuggestionIndex(0);
    setSuggestionPosition({ top: -300, left: 0 });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Content Area */}
          <div className="p-6">
            <div className="relative">
              <div
                ref={editableRef}
                contentEditable
                onInput={handleInput}
                // onKeyDown={handleKeyDown}
                className="w-full min-h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
                style={{ maxHeight: '400px', overflowY: 'auto' }}
                data-placeholder="Type @ for fields, / for commands, or click + to browse available options..."
              />
              
              <style jsx>{`
                [contenteditable]:empty:before {
                  content: attr(data-placeholder);
                  color: #9ca3af;
                  pointer-events: none;
                  position: absolute;
                }
              `}</style>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionRef}
                  className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto min-w-80"
                  style={{
                    top: `${suggestionPosition.top}px`,
                    left: `${suggestionPosition.left}px`,
                  }}
                >
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      <Search size={12} />
                      {currentTrigger === '@' ? 'Available Fields' : 'Available Commands'}
                    </div>
                    {filteredSuggestions.map((item, index) => (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertSuggestion(item);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className={`px-3 py-2 cursor-pointer flex items-center gap-3 rounded transition-colors ${
                          index === selectedSuggestionIndex 
                            ? (item.type === 'field' ? 'bg-blue-50 text-blue-900' : 'bg-purple-50 text-purple-900')
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'field' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformAIPromptUI;
