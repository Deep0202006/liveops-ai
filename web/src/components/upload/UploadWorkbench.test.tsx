import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadWorkbench } from "./UploadWorkbench";
test("file picker is labelled and validation is keyboard actionable",async()=>{const user=userEvent.setup();const select=vi.fn();render(<UploadWorkbench busy={false} demoMode={false} onSelect={select} onSample={vi.fn()} onValidate={vi.fn()} onReset={vi.fn()}/>);const input=screen.getByLabelText(/machine trajectory csv/i);await user.upload(input,new File(["a"],"machine.csv",{type:"text/csv"}));expect(select).toHaveBeenCalled();expect(screen.getByRole("button",{name:"Validate trajectory"})).toBeDisabled()});
