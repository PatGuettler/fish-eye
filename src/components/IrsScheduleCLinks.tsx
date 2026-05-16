import {
  IRS_SCHEDULE_C_ABOUT,
  IRS_SCHEDULE_C_PDF,
} from "../constants/irsScheduleC";

type Props = {
  className?: string;
};

export function IrsScheduleCLinks({ className = "" }: Props) {
  return (
    <p className={`irs-links ${className}`.trim()}>
      <a
        href={IRS_SCHEDULE_C_PDF}
        target="_blank"
        rel="noopener noreferrer"
        download="f1040sc.pdf"
      >
        Download Schedule C (PDF)
      </a>
      <span aria-hidden> · </span>
      <a href={IRS_SCHEDULE_C_ABOUT} target="_blank" rel="noopener noreferrer">
        About Schedule C — IRS
      </a>
    </p>
  );
}
