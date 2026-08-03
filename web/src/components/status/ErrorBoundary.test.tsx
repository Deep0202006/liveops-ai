import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";
function Broken(): JSX.Element { throw new Error("controlled"); }
test("contains unexpected rendering failures and offers recovery",async()=>{const spy=vi.spyOn(console,"error").mockImplementation(()=>undefined);render(<ErrorBoundary area="chart"><Broken/></ErrorBoundary>);expect(screen.getByRole("alert")).toHaveTextContent("Sensor chart could not render");await userEvent.click(screen.getByRole("button",{name:"Retry view"}));expect(screen.getByRole("alert")).toBeVisible();spy.mockRestore()});
