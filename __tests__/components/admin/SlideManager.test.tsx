// __tests__/components/admin/SlideManager.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SlideManager } from "@/components/admin/SlideManager";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation");

const mockSlides = [
  {
    id: "1",
    title: "Slide 1",
    subtitle: "Test subtitle",
    type: "IMAGE",
    order: 0,
    isActive: true,
    mediaUrl: "/test.jpg",
  },
];

describe("SlideManager", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test("renders slide list", () => {
    render(<SlideManager slides={mockSlides} />);
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
  });

  test("handles slide reordering", async () => {
    const onReorder = jest.fn();
    render(<SlideManager slides={mockSlides} onReorder={onReorder} />);

    const slideItem = screen.getByTestId("slide-item-1");
    fireEvent.dragStart(slideItem);
    fireEvent.dragEnd(slideItem);

    expect(onReorder).toHaveBeenCalled();
  });

  test("toggles slide activation", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<SlideManager slides={mockSlides} />);
    const toggle = screen.getByRole("switch");
    await userEvent.click(toggle);

    expect(mockFetch).toHaveBeenCalled();
  });

  test("deletes slide", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<SlideManager slides={mockSlides} />);
    const deleteButton = screen.getByRole("button", { name: /törlés/i });
    await userEvent.click(deleteButton);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/slides/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
