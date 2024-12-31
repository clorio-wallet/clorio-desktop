interface IProps {
  version: string;
}

export const UpdateMessage = ({ version }: IProps) => (
  <span>
    There is a new release 🎉 v{version} <br />
    <a
      href={import.meta.env.VITE_REACT_APP_GITHUB_RELEASE_URL}
      target="_blank"
      rel="noreferrer"
      className="github-link"
    >
      Click here
    </a>{' '}
    to download the update.
  </span>
);
export const UpdateError = (
  <span>
    There was an error while updating the app. Retry or download it manually from <br />
    <a
      href={import.meta.env.VITE_REACT_APP_GITHUB_RELEASE_URL}
      target="_blank"
      rel="noreferrer"
      className="github-link"
    >
      here.
    </a>
  </span>
);
