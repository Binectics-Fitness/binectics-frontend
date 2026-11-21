import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactMessageForm, buildContactMailto } from "./ContactMessageForm";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("ContactMessageForm", () => {
  let href = "";
  beforeEach(() => {
    href = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { set href(v: string) { href = v; }, get href() { return href; } },
    });
  });

  it("shows field errors and opens nothing when the form is incomplete", () => {
    render(<ContactMessageForm />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    expect(screen.getByText("Please write at least 10 characters")).toBeInTheDocument();
    expect(href).toBe("");
  });

  it("opens a mail draft to the help inbox with the message", () => {
    render(<ContactMessageForm />);
    fill("Name", "Ada Obi");
    fill("Email", "ada@example.com");
    fill("Subject", "Gym onboarding");
    fill("Message", "We run two gyms in Lagos.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(href.startsWith("mailto:help@binectics.com?subject=Gym%20onboarding")).toBe(true);
    expect(decodeURIComponent(href)).toContain("We run two gyms in Lagos.");
  });

  it("does nothing when the honeypot is filled", () => {
    const { container } = render(<ContactMessageForm />);
    fill("Name", "Bot");
    fill("Email", "bot@example.com");
    fill("Subject", "Buy now");
    fill("Message", "Cheap followers here");
    fireEvent.change(container.querySelector('input[name="website"]')!, { target: { value: "spam.example" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(href).toBe("");
  });
});

describe("buildContactMailto", () => {
  it("encodes the subject and body", () => {
    const url = buildContactMailto({ name: "A B", email: "a@b.co", subject: "Hi & bye", message: "Line one\nLine two" });
    expect(url).toContain("subject=Hi%20%26%20bye");
    expect(url).toContain("Line%20one%0ALine%20two");
  });
});
