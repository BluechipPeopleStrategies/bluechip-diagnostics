import { useEffect } from 'react';

export default function QuestionView({ question, selectedValue, onAnswer }) {
  useEffect(() => {
    function handleKey(e) {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < (question.options?.length ?? 0)) {
        onAnswer(question.options[idx].value);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [question, onAnswer]);

  return (
    <div>
      <h2 className="bc-question-text">{question.text}</h2>
      <ul className="bc-option-list">
        {question.options.map((opt, i) => (
          <li key={String(opt.value)}>
            <button
              type="button"
              className={`bc-option ${selectedValue === opt.value ? 'is-selected' : ''}`}
              onClick={() => onAnswer(opt.value)}
            >
              <span className="bc-option-shortcut">{i + 1}</span>
              <span>{opt.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
