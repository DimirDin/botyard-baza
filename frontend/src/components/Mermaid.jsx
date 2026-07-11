import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Инициализация mermaid с темной темой, соответствующей терминалу
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose", // Разрешаем HTML-ссылки в SVG
  themeVariables: {
    background: "#111110",
    primaryColor: "#1a1a18",
    primaryTextColor: "#F5F3EC",
    primaryBorderColor: "#26261f",
    lineColor: "#d97757",
    secondaryColor: "#1c1c1a",
    tertiaryColor: "#2c2c28",
    noteBkgColor: "#1c1c1a",
    noteTextColor: "#d8d6cc",
    actorBkg: "#1a1a18",
    actorBorder: "#26261f",
    actorTextColor: "#F5F3EC",
    signalColor: "#d97757",
    signalTextColor: "#d8d6cc",
    labelBoxBorderColor: "#26261f",
    labelBoxBkgColor: "#1a1a18",
    labelTextColor: "#d8d6cc",
    loopBkgColor: "#1c1c1a",
    loopBorderColor: "#26261f",
    titleColor: "#F5F3EC",
  },
});

const INTERNAL_LINK_RE = /^(entry|tool|prompt):(.+)$/;

export function Mermaid({ chart, onNavigate }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    // Генерируем уникальный ID для инстанса рендеринга
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    const renderChart = async () => {
      try {
        // Очищаем предыдущую ошибку
        setError(null);
        
        // Валидируем синтаксис
        await mermaid.parse(chart);
        
        // Рендерим SVG
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Mermaid error:", err);
        if (isMounted) {
          setError(err.message || "Ошибка построения диаграммы");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Перехват кликов по SVG-ссылкам
  const handleSvgClick = (e) => {
    const link = e.target.closest("a");
    if (link) {
      const href = link.getAttribute("xlink:href") || link.getAttribute("href");
      if (href) {
        const match = INTERNAL_LINK_RE.exec(href);
        if (match && onNavigate) {
          e.preventDefault();
          const [, kind, ref] = match;
          onNavigate(kind, ref);
        }
      }
    }
  };

  if (error) {
    return (
      <div 
        className="mermaid-error" 
        style={{ 
          color: "var(--seg-gotcha)", 
          fontFamily: "var(--font-mono)", 
          fontSize: "12px", 
          border: "1px dashed var(--seg-gotcha)", 
          padding: "10px",
          background: "rgba(224, 113, 79, 0.08)",
          borderRadius: "4px",
          margin: "15px 0",
          whiteSpace: "pre-wrap"
        }}
      >
        <strong>[Mermaid Error]:</strong> {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-chart"
      onClick={handleSvgClick}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ 
        overflowX: "auto", 
        margin: "15px 0", 
        background: "#111110",
        padding: "10px",
        borderRadius: "6px",
        border: "1px solid #1e1e1c"
      }}
    />
  );
}
