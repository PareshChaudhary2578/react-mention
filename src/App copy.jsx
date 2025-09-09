import React, { useState, useRef, useEffect } from 'react';

const MentionInput = () => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [currentMention, setCurrentMention] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  
  const editableRef = useRef(null);
  const suggestionRef = useRef(null);

  // Sample users for mentions
  const users = [
    { id: 1, name: 'John Doe', username: 'johndoe' },
    { id: 2, name: 'Jane Smith', username: 'janesmith' },
    { id: 3, name: 'Bob Johnson', username: 'bobjohnson' },
    { id: 4, name: 'Alice Brown', username: 'alicebrown' },
    { id: 5, name: 'Charlie Wilson', username: 'charliewilson' },
    { id: 6, name: 'Diana Davis', username: 'dianadavis' },
  ];

  const getFilteredSuggestions = () => {
    if (!currentMention) return users;
    return users.filter(user => 
      user.name.toLowerCase().includes(currentMention.toLowerCase()) ||
      user.username.toLowerCase().includes(currentMention.toLowerCase())
    );
  };

  // Get cursor position for dropdown placement
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

  // Get plain text from contentEditable
  const getPlainText = () => {
    if (!editableRef.current) return '';
    return editableRef.current.innerText || '';
  };

  // Get cursor position in text
  const getCursorOffset = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  const handleInput = (e) => {
    const text = getPlainText();
    const cursorPosition = getCursorOffset();
    
    // Find the last @ before cursor
    let mentionStart = -1;
    let searchText = '';
    
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i];
      
      if (char === '@') {
        mentionStart = i;
        searchText = text.substring(i + 1, cursorPosition);
        break;
      }
      
      if (char === ' ' || char === '\n' || char === '\t') {
        break;
      }
    }
    
    if (mentionStart !== -1) {
      setCurrentMention(searchText);
      setMentionStartIndex(mentionStart);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(0);
      
      setTimeout(() => {
        const position = getCursorPosition();
        setSuggestionPosition(position);
      }, 10);
    } else {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStartIndex(-1);
    }
  };

  const insertMention = (user) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Find the @ symbol by traversing backwards from cursor
    let currentNode = range.startContainer;
    let currentOffset = range.startOffset;
    let mentionStartOffset = 0;
    let found = false;
    
    // If we're in a text node, look for @ in current text
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.textContent;
      for (let i = currentOffset - 1; i >= 0; i--) {
        if (text[i] === '@') {
          mentionStartOffset = i;
          found = true;
          break;
        }
        if (text[i] === ' ' || text[i] === '\n') break;
      }
    }
    
    if (!found) return;
    
    // Create mention element
    const mentionSpan = document.createElement('span');
    mentionSpan.contentEditable = false;
    mentionSpan.className = 'mention-tag';
    mentionSpan.style.cssText = `
      background-color: #dbeafe;
      color: #1e40af;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
      font-weight: 500;
      margin: 0 2px;
      display: inline-block;
    `;
    mentionSpan.textContent = `${user.username}`;
    mentionSpan.setAttribute('data-user-id', user.id);
    mentionSpan.setAttribute('data-username', user.username);
    
    // Replace the text from @ to cursor with mention
    const textNode = currentNode;
    const beforeText = textNode.textContent.substring(0, mentionStartOffset);
    const afterText = textNode.textContent.substring(currentOffset);
    
    // Create new text nodes
    const beforeTextNode = document.createTextNode(beforeText);
    const afterTextNode = document.createTextNode(' ' + afterText);
    
    // Replace the current text node
    const parent = textNode.parentNode;
    parent.insertBefore(beforeTextNode, textNode);
    parent.insertBefore(mentionSpan, textNode);
    parent.insertBefore(afterTextNode, textNode);
    parent.removeChild(textNode);
    
    // Set cursor after the mention
    const newRange = document.createRange();
    newRange.setStart(afterTextNode, 1); // After the space
    newRange.setEnd(afterTextNode, 1);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    setShowSuggestions(false);
    setCurrentMention('');
    setMentionStartIndex(-1);
    
    editableRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    const filteredSuggestions = getFilteredSuggestions();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const newIndex = prev < filteredSuggestions.length - 1 ? prev + 1 : 0;
        
        // Auto-scroll to selected item
        setTimeout(() => {
          if (suggestionRef.current) {
            const selectedItem = suggestionRef.current.children[0]?.children[newIndex];
            if (selectedItem) {
              selectedItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              });
            }
          }
        }, 10);
        
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : filteredSuggestions.length - 1;
        
        // Auto-scroll to selected item
        setTimeout(() => {
          if (suggestionRef.current) {
            const selectedItem = suggestionRef.current.children[0]?.children[newIndex];
            if (selectedItem) {
              selectedItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              });
            }
          }
        }, 10);
        
        return newIndex;
      });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filteredSuggestions[selectedSuggestionIndex]) {
        insertMention(filteredSuggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStartIndex(-1);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
          editableRef.current && !editableRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get mentioned users
  const getMentionedUsers = () => {
    if (!editableRef.current) return [];
    const mentionElements = editableRef.current.querySelectorAll('.mention-tag');
    return Array.from(mentionElements).map(el => ({
      username: el.getAttribute('data-username'),
      userId: el.getAttribute('data-user-id'),
      name: users.find(u => u.id === parseInt(el.getAttribute('data-user-id')))?.name || 'Unknown'
    }));
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Mention Functionality with Styled Names</h1>
      
      <div className="relative">
        <div
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full min-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-5"
          style={{
            maxHeight: '200px',
            overflowY: 'auto'
          }}
          data-placeholder="Type @ to mention someone..."
        />
        
        {/* Placeholder text */}
        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }
        `}</style>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-48"
            style={{
              top: `${suggestionPosition.top}px`,
              left: `${suggestionPosition.left}px`,
            }}
          >
            <div className="p-1">
              {filteredSuggestions.map((user, index) => (
                <div
                  key={user.id}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent focus loss from contentEditable
                    insertMention(user);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    insertMention(user);
                  }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  className={`px-3 py-2 cursor-pointer flex flex-col rounded transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">@{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Style examples */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Mention Styles</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span 
              className="mention-tag px-2 py-1 rounded font-medium"
              style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                border: '1px solid #bfdbfe'
              }}
            >
              @johndoe
            </span>
            <span className="text-gray-600">Styled mention (Blue theme)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ul className="mt-2 space-y-1">
          <li>• Type "@" followed by a name or username to see suggestions</li>
          <li>• Selected mentions will be highlighted with colored background</li>
          <li>• Use arrow keys to navigate suggestions</li>
          <li>• Press Enter or Tab to select, Escape to cancel</li>
          <li>• Mentions are non-editable styled elements</li>
        </ul>
      </div>
      
      {getMentionedUsers().length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">Mentioned Users:</p>
          <div className="flex flex-wrap gap-2">
            {getMentionedUsers().map((mention, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                {mention.name} (@{mention.username})
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700">Plain text content:</p>
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap font-mono">
          {editableRef.current ? getPlainText() : '(empty)'}
        </p>
      </div>
    </div>
  );
};

export default MentionInput;