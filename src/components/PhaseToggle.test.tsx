import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhaseToggle } from "./PhaseToggle";

describe("PhaseToggle", () => {
  it("renders both analyses and calls onChange on click", async () => {
    const onChange = vi.fn();
    render(<PhaseToggle phase="phase1" onChange={onChange} />);
    expect(screen.getByText(/ПРЕДВАРИТЕЛЕН АНАЛИЗ/)).toBeInTheDocument();
    expect(screen.getByText(/ЗАДЪЛБОЧЕН АНАЛИЗ/)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/ЗАДЪЛБОЧЕН АНАЛИЗ/));
    expect(onChange).toHaveBeenCalledWith("phase2");
  });
});
