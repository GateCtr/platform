import { Button } from "@/components/ui/button";

export function ButtonDemo() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-primary-700 mb-4">
          Button Variants
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Primary (Navy)</Button>
          <Button variant="secondary">Secondary (Cyan)</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl font-bold text-primary-700 mb-4">
          Button Sizes
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl font-bold text-primary-700 mb-4">
          Disabled State
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled Primary</Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl font-bold text-primary-700 mb-4">
          With Icons
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Project
          </Button>
          <Button variant="secondary">
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl font-bold text-primary-700 mb-4">
          Real-world Examples
        </h3>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex gap-2">
            <Button className="flex-1">Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
          <Button variant="secondary" className="w-full">
            Join Waitlist
          </Button>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
