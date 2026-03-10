import { Stack, Typography } from "@mui/material";
import "./Banner.css";

const Banner = (props) => {
  return (
    <>
      <Stack
        className="overlay-text-container"
        sx={{ paddingLeft: 1, paddingTop: 0 }}
      >
        <Typography
          variant="overline"
          sx={{
            fontWeight: 750,
            textShadow:
              "2px 2px 4px rgba(0, 0, 0, 0.25), -2px -2px 4px rgba(0, 0, 0, 0.25)",
          }}
        >
          TheWay V{process.env.REACT_APP_VERSION}
        </Typography>


        <Typography
          color="lightgrey"
          variant="overline"
          sx={{
            lineHeight: "normal",
            textShadow: `
      -1px -2px 0 #000,
       1px -2px 0 #000,
      -1px  2px 0 #000,
       1px  2px 0 #000,
       0  0  4px rgba(0,0,0,0.8)
    `,
          }}
        >
          {props.text}
        </Typography>
      </Stack>
      <img
        alt="module-image"
        className="image-container"
        src={props.imagePath}
        draggable="false"
      />
    </>
  );
};

export default Banner;
