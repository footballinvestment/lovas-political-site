// __tests__/components/ContactForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactForm from "@/components/ContactForm";
import userEvent from "@testing-library/user-event";

describe("ContactForm", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders all form fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/név/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefonszám/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kerület/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tárgy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/üzenet/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  test("form submission with valid data", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "success" }),
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/név/i), "Teszt Elek");
    await userEvent.type(screen.getByLabelText(/email/i), "teszt@example.com");
    await userEvent.type(screen.getByLabelText(/tárgy/i), "Teszt tárgy");
    await userEvent.type(screen.getByLabelText(/üzenet/i), "Teszt üzenet");

    fireEvent.click(screen.getByRole("button", { name: /küldés/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Teszt Elek",
          email: "teszt@example.com",
          phone: "",
          subject: "Teszt tárgy",
          message: "Teszt üzenet",
          district: "",
          preferredContact: "email",
          newsletter: false,
        }),
      });
    });

    expect(
      await screen.findByText(/köszönjük megkeresését/i)
    ).toBeInTheDocument();
  });

  test("displays error message on submission failure", async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/név/i), "Teszt Elek");
    await userEvent.type(screen.getByLabelText(/email/i), "teszt@example.com");
    await userEvent.type(screen.getByLabelText(/tárgy/i), "Teszt tárgy");
    await userEvent.type(screen.getByLabelText(/üzenet/i), "Teszt üzenet");

    fireEvent.click(screen.getByRole("button", { name: /küldés/i }));

    expect(await screen.findByText(/hiba történt/i)).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("button", { name: /küldés/i }));

    expect(screen.getByLabelText(/név/i)).toBeInvalid();
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    expect(screen.getByLabelText(/tárgy/i)).toBeInvalid();
    expect(screen.getByLabelText(/üzenet/i)).toBeInvalid();
  });

  test("toggles newsletter subscription", async () => {
    render(<ContactForm />);

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
