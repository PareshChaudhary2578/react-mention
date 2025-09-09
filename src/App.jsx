import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from '@mui/material';

const MentionInput = () => {
  const editableRef = useRef(null);
  const suggestionRef = useRef(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [lastCaretPos, setLastCaretPos] = useState({ top: 0, left: 0 });
  const [currentMention, setCurrentMention] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Tooltip state
  const [tooltipUser, setTooltipUser] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);

  // sample users
  const users = [
    { id: 1, name: 'John Doe', username: 'johndoe', email: 'john.doe@example.com', role: 'Developer' },
    { id: 2, name: 'Jane Smith', username: 'janesmith', email: 'jane.smith@example.com', role: 'Designer' },
    { id: 3, name: 'Bob Johnson', username: 'bobjohnson', email: 'bob.johnson@example.com', role: 'Product Manager' },
    { id: 4, name: 'Alice Brown', username: 'alicebrown', email: 'alice.brown@example.com', role: 'Marketing' },
    { id: 5, name: 'Charlie Wilson', username: 'charliewilson', email: 'charlie.wilson@example.com', role: 'Sales' },
    { id: 6, name: 'Diana Davis', username: 'dianadavis', email: 'diana.davis@example.com', role: 'HR Manager' },
  ];

  const getFilteredSuggestions = () => {
    if (!currentMention) return users;
    const q = currentMention.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  };

  const createTooltipContent = (user) => (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name}</div>
      <div style={{ fontSize: '12px', opacity: 0.8 }}>{user.username}</div>
      <div style={{ fontSize: '12px', opacity: 0.8 }}>{user.email}</div>
      <div style={{ fontSize: '12px', opacity: 0.8 }}>{user.role}</div>
    </div>
  );

  // caret rect helper
  const getCaretRectRelativeToEditor = () => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(false);

      const marker = document.createElement('span');
      marker.appendChild(document.createTextNode('\u200b'));
      range.insertNode(marker);

      const markerRect = marker.getBoundingClientRect();
      const editorRect = editableRef.current.getBoundingClientRect();

      const newRange = document.createRange();
      newRange.setStartAfter(marker);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      marker.parentNode && marker.parentNode.removeChild(marker);

      return {
        top: markerRect.bottom - editorRect.top + editableRef.current.scrollTop,
        left: markerRect.left - editorRect.left + editableRef.current.scrollLeft,
      };
    } catch {
      return null;
    }
  };

const insertMention = (user) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  let node = range.startContainer;

  // If inside element node, move into text node
  if (node.nodeType !== Node.TEXT_NODE) {
    if (node.childNodes.length > 0) {
      node = node.childNodes[range.startOffset - 1] || node;
    }
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    // find "@" backward from cursor
    const beforeCursor = text.substring(0, range.startOffset);
    const afterCursor = text.substring(range.startOffset);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex >= 0) {
      const beforeText = beforeCursor.substring(0, atIndex); // everything before "@"

      // --- mention span ---
      const mentionSpan = document.createElement('span');
      mentionSpan.contentEditable = 'false';
      mentionSpan.className = 'mention-tag';
      mentionSpan.style.cssText = `
        background-color: #dbeafe;
        color: #1e40af;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #bfdbfe;
        font-weight: 500;
        margin: 0 2px;
        cursor: pointer;
      `;
      mentionSpan.textContent = user.username;

      // 🔥 restore tooltip hover
      mentionSpan.addEventListener("mouseenter", () => {
        setTooltipUser(user);
        setTooltipAnchor(mentionSpan);
      });
      mentionSpan.addEventListener("mouseleave", () => {
        setTooltipUser(null);
        setTooltipAnchor(null);
      });

      // replace old text node with new nodes
      const parent = node.parentNode;
      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode(' ' + afterCursor);

      parent.insertBefore(beforeNode, node);
      parent.insertBefore(mentionSpan, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);

      // move caret after mention
      const newRange = document.createRange();
      newRange.setStart(afterNode, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStartIndex(-1);
    }
  }
};



  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const getCursorOffset = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const handleInput = () => {
    const text = editableRef.current.innerText || '';
    const cursorPosition = getCursorOffset();

    let mentionStart = -1;
    let searchText = '';

    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i];
      if (char === '@') {
        mentionStart = i;
        searchText = text.substring(i + 1, cursorPosition);
        break;
      }
      if (/\s/.test(char)) break;
    }

    if (mentionStart !== -1) {
      setCurrentMention(searchText);
      setMentionStartIndex(mentionStart);
      setSelectedSuggestionIndex(0);

      const caretPos = getCaretRectRelativeToEditor();
      if (caretPos) {
        setSuggestionPosition({ top: caretPos.top, left: caretPos.left });
        setLastCaretPos({ top: caretPos.top, left: caretPos.left });
      } else {
        setSuggestionPosition(lastCaretPos);
      }

      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStartIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const filtered = getFilteredSuggestions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const picked = filtered[selectedSuggestionIndex];
      if (picked) insertMention(picked);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStartIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && suggestionRef.current.contains(event.target)) return;
      if (editableRef.current && editableRef.current.contains(event.target)) return;
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMentionedUsers = () => {
    if (!editableRef.current) return [];
    const mentionElements = editableRef.current.querySelectorAll('.mention-tag');
    return Array.from(mentionElements).map(el => ({
      username: el.getAttribute('data-username'),
      userId: el.getAttribute('data-user-id'),
      name: el.getAttribute('data-user-name'),
      email: el.getAttribute('data-user-email'),
      role: el.getAttribute('data-user-role')
    }));
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Mention Input</h1>

      <div className="relative">
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full min-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-5"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
          data-placeholder="Type @ to mention someone..."
        />

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
                  onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  className={`px-3 py-2 cursor-pointer flex flex-col rounded transition-colors ${index === selectedSuggestionIndex ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'}`}
                >
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Tooltip
        open={Boolean(tooltipUser)}
        title={tooltipUser ? createTooltipContent(tooltipUser) : ""}
        PopperProps={{ anchorEl: tooltipAnchor }}
        placement="top"
        arrow
      >
        <span />
      </Tooltip>

      {getMentionedUsers().length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">Mentioned Users:</p>
          <div className="flex flex-wrap gap-2">
            {getMentionedUsers().map((mention, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                {mention.name} ({mention.username})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
