import {
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
} from "@mui/material";
import { createModal } from "react-modal-promise";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uiActions } from "../store/ui";
import { saveModulePreferences } from "../utils/savePreferences";

/**
 * Four-option dialog WITH "Remember this choice"
 */
const FourDialog = ({
  isOpen,
  onResolve,
  onReject,
  title,
  op1,
  op2,
  op3,
  op4,
}) => {
  const { module } = useSelector((state) => state.dcsPoint);
  const [rememberChoice, setRememberChoice] = useState(false);
  const dispatch = useDispatch();

  const handleRememberChoice = (event) => {
    setRememberChoice(event.target.checked);
  };

  const handleOptionSelected = (option) => {
    if (rememberChoice) {
      const choice = { module, option };
      dispatch(uiActions.setModulePreference(choice));
      saveModulePreferences(choice);
    }
    onResolve(option);
  };

  return (
    <Dialog open={isOpen} onClose={onReject}>
      <DialogTitle sx={{ textAlign: "center" }}>{title}</DialogTitle>
      <Stack>
        <Button onClick={() => handleOptionSelected(op1)}>{op1}</Button>
        <Button onClick={() => handleOptionSelected(op2)}>{op2}</Button>
        <Button onClick={() => handleOptionSelected(op3)}>{op3}</Button>
        <Button onClick={() => handleOptionSelected(op4)}>{op4}</Button>

        <FormGroup sx={{ alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberChoice}
                onChange={handleRememberChoice}
              />
            }
            label="Remember this choice"
          />
        </FormGroup>
      </Stack>
    </Dialog>
  );
};

/**
 * Four-option dialog WITHOUT remembering (simple / transient)
 */
const FourSimpleDialog = ({
  isOpen,
  onResolve,
  onReject,
  title,
  op1,
  op2,
  op3,
  op4,
}) => {
  const handleOptionSelected = (option) => {
    onResolve(option);
  };

  return (
    <Dialog open={isOpen} onClose={onReject}>
      <DialogTitle sx={{ textAlign: "center" }}>{title}</DialogTitle>
      <Stack>
        <Button onClick={() => handleOptionSelected(op1)}>{op1}</Button>
        <Button onClick={() => handleOptionSelected(op2)}>{op2}</Button>
        <Button onClick={() => handleOptionSelected(op3)}>{op3}</Button>
        <Button onClick={() => handleOptionSelected(op4)}>{op4}</Button>
      </Stack>
    </Dialog>
  );
};

// Exports
export const FourOptionsDialog = createModal(FourDialog);
export const FourOptionsSimpleDialog = createModal(FourSimpleDialog);

/*import {
    Button,
    Dialog,
    DialogTitle,
    Stack,
  } from "@mui/material";
  import { createModal } from "react-modal-promise";

  const FourSimpleDialog = ({ isOpen, onResolve, onReject, title, op1, op2, op3, op4 }) => {
    const handleOptionSelected = (option) => {
      onResolve(option);
    };

    return (
      <Dialog open={isOpen} onClose={onReject}>
        <DialogTitle>{title}</DialogTitle>
        <Stack>
          <Button onClick={() => handleOptionSelected(op1)}>{op1}</Button>
          <Button onClick={() => handleOptionSelected(op2)}>{op2}</Button>
          <Button onClick={() => handleOptionSelected(op3)}>{op3}</Button>
          <Button onClick={() => handleOptionSelected(op4)}>{op4}</Button>
        </Stack>
      </Dialog>
    );
  };

  export const FourOptionsSimpleDialog = createModal(FourSimpleDialog);*/
