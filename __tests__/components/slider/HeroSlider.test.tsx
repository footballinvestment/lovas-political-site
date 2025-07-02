// __tests__/components/slider/HeroSlider.test.tsx
import { render, screen, act, fireEvent } from "@testing-library/react";
import HeroSlider from "@/components/slider/HeroSlider";

const mockSlides = [
  {
    id: "1",
    type: "IMAGE",
    title: "Test Title 1",
    subtitle: "Subtitle 1",
    mediaUrl: "/test1.jpg",
    ctaText: "Learn More",
    ctaLink: "/test1",
    isActive: true,
    autoPlay: true,
    isLoop: true,
    isMuted: true,
    gradientFrom: "",
    gradientTo: "",
  },
  {
    id: "2",
    type: "VIDEO",
    title: "Test Title 2",
    subtitle: "Subtitle 2",
    mediaUrl: "/test.mp4",
    isActive: true,
    autoPlay: true,
    isLoop: true,
    isMuted: true,
    gradientFrom: "",
    gradientTo: "",
    ctaText: null,
    ctaLink: null,
  },
];

jest.useFakeTimers();

describe("HeroSlider", () => {
  beforeEach(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  test("navigates with arrow buttons", () => {
    render(<HeroSlider slides={mockSlides} />);

    const nextButton = screen.getByLabelText("Következő slide");
    fireEvent.click(nextButton);
    expect(screen.getByText("Test Title 2")).toBeInTheDocument();

    const prevButton = screen.getByLabelText("Előző slide");
    fireEvent.click(prevButton);
    expect(screen.getByText("Test Title 1")).toBeInTheDocument();
  });

  test("handles touch swipe navigation", () => {
    render(<HeroSlider slides={mockSlides} />);
    const slider = screen.getByTestId("slider");

    fireEvent.touchStart(slider, { touches: [{ clientX: 500 }] });
    fireEvent.touchMove(slider, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slider);

    expect(screen.getByText("Test Title 2")).toBeInTheDocument();
  });

  test("pauses autoplay on hover", () => {
    render(<HeroSlider slides={mockSlides} />);
    const slider = screen.getByTestId("slider");

    fireEvent.mouseEnter(slider);
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText("Test Title 1")).toBeInTheDocument();
  });

  test("renders slide indicators", () => {
    render(<HeroSlider slides={mockSlides} />);
    const indicators = screen.getAllByRole("button", { name: /slide$/i });
    expect(indicators).toHaveLength(2);
  });
});
