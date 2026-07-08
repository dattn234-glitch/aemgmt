import * as React from "react";

import { cn } from "@/lib/utils";

function Form({ className, ...props }: React.ComponentProps<"form">) {
  return <form data-slot="form" className={cn("min-w-0", className)} {...props} />;
}

export { Form };
