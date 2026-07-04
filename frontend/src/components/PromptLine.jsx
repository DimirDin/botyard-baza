export function PromptLine({ section, dirty = false, right = null }) {
  return (
    <div className="promptline">
      <span className="promptline__arrow">➜</span>
      <span className="promptline__segment">baza</span>
      <span>git:({section})</span>
      {dirty && <span className="promptline__dirty">✗</span>}
      {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
    </div>
  );
}
