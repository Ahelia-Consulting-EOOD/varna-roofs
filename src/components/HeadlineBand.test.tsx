import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeadlineBand } from "./HeadlineBand";

describe("HeadlineBand", () => {
  it("renders four tiles with numbers and labels", () => {
    render(
      <HeadlineBand
        tiles={[
          { number: "~79 000", label_bg: "имота" },
          { number: "~25%", label_bg: "Фаза 1" },
          { number: "до ~75%", label_bg: "Фаза 2" },
          { number: "2 фази", label_bg: "Първоначално → Задълбочено" },
        ]}
      />
    );
    expect(screen.getByText("~79 000")).toBeInTheDocument();
    expect(screen.getByText("~25%")).toBeInTheDocument();
    expect(screen.getByText("до ~75%")).toBeInTheDocument();
    expect(screen.getByText("2 фази")).toBeInTheDocument();
    expect(screen.getByText("имота")).toBeInTheDocument();
  });
});
