/**
 * Client-side JavaScript for attribute buttons
 * Handles dropdown menus, cross-button synchronization, and localStorage persistence
 */

export const CLIENT_SCRIPT = `
<script>
(function() {
  'use strict';

  // Initialize attribute buttons on page load
  document.addEventListener('DOMContentLoaded', function() {
    initializeAttributeButtons();
  });

  function initializeAttributeButtons() {
    const buttons = document.querySelectorAll('button.attribute-substitution');

    buttons.forEach(button => {
      // Restore saved value from localStorage
      const attrName = button.getAttribute('data-attribute');
      const savedValue = localStorage.getItem('attr-' + attrName);

      if (savedValue) {
        updateButtonValue(attrName, savedValue);
      }

      // Add click handler
      button.addEventListener('click', function(e) {
        e.preventDefault();
        showDropdown(button);
      });
    });
  }

  function showDropdown(button) {
    const attrName = button.getAttribute('data-attribute');
    const currentValue = button.getAttribute('data-value');
    const optionsJson = button.getAttribute('data-options');

    let options = [];
    try {
      options = JSON.parse(optionsJson.replace(/&quot;/g, '"'));
    } catch (e) {
      console.error('Failed to parse options for', attrName, e);
      return;
    }

    if (options.length === 0) {
      return; // No options to show
    }

    // Remove existing dropdown if any
    removeDropdown();

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'attribute-dropdown';
    dropdown.style.cssText = 'position: absolute; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px;';

    // Position dropdown below button
    const rect = button.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';

    // Add options
    options.forEach(option => {
      const item = document.createElement('div');
      item.textContent = option;
      item.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;';

      if (option === currentValue) {
        item.style.fontWeight = 'bold';
        item.style.backgroundColor = '#f0f0f0';
      }

      item.addEventListener('mouseenter', function() {
        if (option !== currentValue) {
          item.style.backgroundColor = '#f9f9f9';
        }
      });

      item.addEventListener('mouseleave', function() {
        if (option !== currentValue) {
          item.style.backgroundColor = 'white';
        }
      });

      item.addEventListener('click', function() {
        updateButtonValue(attrName, option);
        localStorage.setItem('attr-' + attrName, option);
        removeDropdown();
      });

      dropdown.appendChild(item);
    });

    document.body.appendChild(dropdown);

    // Close dropdown on outside click
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  }

  function handleOutsideClick(e) {
    if (!e.target.closest('.attribute-dropdown') && !e.target.closest('.attribute-substitution')) {
      removeDropdown();
    }
  }

  function removeDropdown() {
    const existing = document.querySelector('.attribute-dropdown');
    if (existing) {
      existing.remove();
    }
    document.removeEventListener('click', handleOutsideClick);
  }

  function updateButtonValue(attrName, newValue) {
    // Update all buttons with this attribute
    const buttons = document.querySelectorAll('button.attribute-substitution[data-attribute="' + attrName + '"]');

    buttons.forEach(button => {
      button.textContent = newValue;
      button.setAttribute('data-value', newValue);
    });
  }
})();
</script>
`;

export function injectClientScript() {
  return CLIENT_SCRIPT;
}
