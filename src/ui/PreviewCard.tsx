import type { CSSProperties } from "react";
import {
  buildGlyphSvg,
  getTemplateFill,
  getTemplateShadow,
  getTemplateStroke,
} from "../shared/preview";
import type { LibraryIcon, TemplateSnapshot } from "../shared/types";

type Props = {
  template: TemplateSnapshot;
  icon: LibraryIcon;
};

export function PreviewCard({ template, icon }: Props) {
  const stroke = getTemplateStroke(template);
  const w = Math.max(1, template.width);
  const h = Math.max(1, template.height);
  const maxCorner = Math.min(w, h) / 2;
  const corner = Math.min(Math.max(0, template.topLeftRadius), maxCorner);
  const isCircle =
    template.shapeHint === "circle" || corner >= maxCorner - 0.5;

  const top = (Math.max(0, template.padding.top) / h) * 100;
  const right = (Math.max(0, template.padding.right) / w) * 100;
  const bottom = (Math.max(0, template.padding.bottom) / h) * 100;
  const left = (Math.max(0, template.padding.left) / w) * 100;

  const shellStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: `${w} / ${h}`,
    background: getTemplateFill(template),
    borderRadius: isCircle ? "50%" : `${(corner / w) * 100}%`,
    boxShadow: getTemplateShadow(template),
    border: stroke
      ? `${Math.min(3, Math.max(1, stroke.width))}px solid ${stroke.color}`
      : "none",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const glyphWrapStyle: CSSProperties = {
    position: "absolute",
    top: `${top}%`,
    right: `${right}%`,
    bottom: `${bottom}%`,
    left: `${left}%`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="preview-item">
      <div className="preview-shell" style={shellStyle}>
        <div
          className="preview-glyph"
          style={glyphWrapStyle}
          dangerouslySetInnerHTML={{ __html: buildGlyphSvg(template, icon) }}
        />
      </div>
      <div className="name">{icon.name}</div>
    </div>
  );
}
