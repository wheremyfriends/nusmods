/**
 * v0 by Vercel.
 * @see https://v0.dev/t/m3sEy7oq4Y3
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="overflow-auto">
      <div className="flex flex-col min-h-dvh">
        <header className="bg-muted text-primary py-8 md:py-12 lg:py-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Plan Your Timetables with Friends in Real-Time
              </h1>
              <p className="text-muted-foreground md:text-xl">
                Easily coordinate lecture, tutorial, and lab slots with your
                friends in real-time.
              </p>
              <div className="flex justify-center gap-2">
                <Link to="/create">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container space-y-12 px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                    Key Features
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Streamline Your Planning
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our real-time timetable planner app helps you and your
                    friends easily coordinate schedules and make plans together.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">Real-Time Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    See your friends' schedules in real-time and find the best
                    time to take classes.
                  </p>
                </div>
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">Group Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Collaborate with your friends to plan classes{" "}
                  </p>
                </div>
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">Automated Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Algorithm to search for the best timetable arrangements.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container space-y-12 px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                    Testimonials
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    What Our Users Say
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Hear from real people who have used our app to plan their
                    schedules with friends.
                  </p>
                </div>
              </div>
              <div className="grid max-w-5xl mx-auto gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border">
                      {/* <AvatarImage src="/placeholder-user.jpg" /> */}
                      <AvatarFallback>JL</AvatarFallback>
                    </Avatar>
                    <div className="grid">
                      <div className="font-semibold">Joshua Lee</div>
                      <div className="text-sm text-muted-foreground">
                        NUS InfoSec, Class of 2025
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <div className="flex items-center gap-px">
                      <StarIcon className="w-4 h-4 fill-primary" />
                      <StarIcon className="w-4 h-4 fill-primary" />
                      <StarIcon className="w-4 h-4 fill-primary" />
                      <StarIcon className="w-4 h-4 fill-primary" />
                      <StarIcon className="w-4 h-4 fill-primary" />
                    </div>
                  </div>
                  <p>
                    "This is NUSMods on crack!!! I can finally stop sending PNG
                    timetables on Telegram and having to hunt them down through
                    the Semester. Only thing now is I have to find friends to
                    use this with 🤡."
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container space-y-12 px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                    FAQ
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Get answers to the most common questions about our real-time
                    timetable planner app.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl gap-6">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-lg font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180">
                    How do I import timetable from NUSMods?
                    <ChevronDownIcon className="w-5 h-5 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 py-3 text-muted-foreground">
                    You don't! Add modules directly using WAMF. However, we do
                    support <strong>exporting</strong> to NUSMods.
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-lg font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180">
                    Why do I need a user account?
                    <ChevronDownIcon className="w-5 h-5 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 py-3 text-muted-foreground">
                    Having a user account is optional. The main reason to have
                    an account is in the event of multiple friend groups, or
                    more precisely, when you want the same timetable to exist in
                    multiple rooms.
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </section>
        </main>
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
          <p className="text-xs text-muted-foreground">
            &copy; 2024 Timetable Planner. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link to="#" className="text-xs hover:underline underline-offset" />
          </nav>
        </footer>
      </div>
    </div>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg
      {...props}
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StarIcon(props) {
  return (
    <svg
      {...props}
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg
      {...props}
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
