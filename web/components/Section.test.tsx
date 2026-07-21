import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("renders an h2 heading by default", () => {
    render(
      <Section title="Executive Summary">
        <p>content</p>
      </Section>
    );
    expect(screen.getByRole("heading", { level: 2, name: "Executive Summary" })).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders an h3 heading when level is 3", () => {
    render(
      <Section title="Findings" level={3}>
        <p>content</p>
      </Section>
    );
    expect(screen.getByRole("heading", { level: 3, name: "Findings" })).toBeInTheDocument();
  });
});
