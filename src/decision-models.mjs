function normalizedText(value) {
  return String(value || '').trim().toLowerCase();
}

function optionTitle(option) {
  if (!option) return '';
  if (typeof option === 'string') return option.trim();
  return String(option.title || option.label || '').trim();
}

function extractOptions(decision) {
  const structured = Array.isArray(decision?.optionsList)
    ? decision.optionsList.map(optionTitle).filter(Boolean)
    : [];
  if (structured.length) return structured;

  const raw = String(decision?.options || '');
  const titled = Array.from(raw.matchAll(/^###\s+(.+)$/gm)).map((match) => match[1].trim()).filter(Boolean);
  if (titled.length) return titled;

  return raw
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .filter(Boolean);
}

export function classifyDecisionType(decision) {
  const options = extractOptions(decision);
  const decisionText = normalizedText(decision?.decision);
  const titleText = normalizedText(decision?.title);
  const combined = `${titleText} ${decisionText}`.trim();

  if (options.length >= 3) {
    return {
      key: 'multiple-choice',
      label: 'Multiple choice',
      options,
      allowsBinary: false,
      allowsOptionSelection: true,
      notesAlwaysAvailable: true
    };
  }

  if (options.length === 2) {
    return {
      key: 'binary',
      label: 'Binary',
      options,
      allowsBinary: true,
      allowsOptionSelection: false,
      notesAlwaysAvailable: true
    };
  }

  if (/\b(yes|no|approve|reject|accept|decline|go\/no-go|go no-go)\b/.test(combined)) {
    return {
      key: 'binary',
      label: 'Binary',
      options,
      allowsBinary: true,
      allowsOptionSelection: false,
      notesAlwaysAvailable: true
    };
  }

  return {
    key: 'nuanced',
    label: 'Nuanced',
    options,
    allowsBinary: false,
    allowsOptionSelection: false,
    notesAlwaysAvailable: true
  };
}

export function latestDecisionResponse(decision) {
  const responses = Array.isArray(decision?.responses) ? decision.responses : [];
  return responses.length ? responses[responses.length - 1] : null;
}
