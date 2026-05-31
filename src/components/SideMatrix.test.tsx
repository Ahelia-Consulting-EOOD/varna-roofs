import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SideMatrix } from "./SideMatrix";
import type { MatrixData } from "../types";

const fixture: MatrixData = {
  header_bg: "Степен",
  levels: [
    { id: "H1", label_bg: "Н1", sub_bg: "" },
    { id: "H2", label_bg: "Н2", sub_bg: "" },
    { id: "H3", label_bg: "Н3", sub_bg: "" },
    { id: "H4", label_bg: "Н4", sub_bg: "" },
  ],
  rows: [
    { id: "r1", label_bg: "Документ 1", cells: { H1: "yes", H2: "no", H3: "no", H4: "no" } },
    { id: "r2", label_bg: "Документ 2", cells: { H1: "no", H2: "yes", H3: "partial", H4: "muni" } },
  ],
};

describe("SideMatrix", () => {
  it("renders rows and fires onCellClick", async () => {
    const onCellClick = vi.fn();
    const onShowAll = vi.fn();
    render(<SideMatrix matrix={fixture} onCellClick={onCellClick} onShowAll={onShowAll} />);
    expect(screen.getByText("Документ 1")).toBeInTheDocument();
    expect(screen.getByText("Документ 2")).toBeInTheDocument();
    const cells = screen.getAllByRole("button").filter(b => b.className.includes("matrix-cell"));
    await userEvent.click(cells[0]);
    expect(onCellClick).toHaveBeenCalledTimes(1);
  });
});
