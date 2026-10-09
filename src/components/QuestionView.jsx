import { useEffect } from 'react';

export default function QuestionView({ question, selectedValue, onAnswer }) {
  useEffect(() => {
    function handleKey(e) {
      // Holding a number key repeats keydown and would answer the next question too; a modifier
      // means a browser shortcut (Ctrl+1 switches tabs), not an answer.
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < (question.options?.length ?? 0)) {
        onAnswer(question.options[idx].value);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [question, onAnswer]);

  return (
    <div className="bc-question" key={question.id}>
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
