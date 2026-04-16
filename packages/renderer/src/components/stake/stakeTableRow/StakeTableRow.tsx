import Avatar from '../../../tools/avatar/avatar';
import Button from '../../UI/Button';
import type {IValidatorData} from './ValidatorDataTypes';

interface IProps {
  index: number;
  element: IValidatorData;
  toggleModal: (element: IValidatorData) => void;
  isDelegating?: boolean;
  loading?: boolean;
  mode?: 'table' | 'card';
}

const BOOSTED_TOOLTIP =
  '~Clorio is built by Carbonara. <br>Earn rewards and support Clorio <br>by delegating to Carbonara ❤️';

const formatStakedAmount = (stakedSum?: string) => `${parseInt(stakedSum || '0').toLocaleString()} MINA`;

const StakeTableRow = ({
  element,
  toggleModal,
  isDelegating,
  loading,
  mode = 'table',
}: IProps) => {
  const isBoosted = +element.priority === 1;
  const supportTooltip = isBoosted ? BOOSTED_TOOLTIP : '';

  const buttonText = isDelegating ? 'Delegating' : 'Delegate';
  const buttonStyle = isDelegating ? 'success' : 'primary';
  const buttonVariant = isDelegating ? undefined : 'glow';
  const buttonHandler = isDelegating ? undefined : () => toggleModal(element);
  const isButtonLoading = !!loading && !!isDelegating;

  const validatorName = element.name || 'Unnamed validator';
  const websiteLabel = element.website ? 'Website' : 'Unavailable';
  const websiteHref = element.website ? `${element.website}?ref=clorio` : '';

  const validatorIdentity = (
    <div className="stake-validator">
      <div className="stake-validator__avatar">
        {element.image ? (
          <img
            className="stake-validator__image"
            src={element.image}
            alt=""
          />
        ) : (
          <Avatar
            className="stake-validator__image"
            address={element.publicKey}
            size="38"
          />
        )}
      </div>
      <div className="stake-validator__copy">
        <div className="stake-validator__title-row">
          <span
            className="stake-validator__name"
            title={validatorName}
          >
            {validatorName}
          </span>
          {isBoosted && (
            <span
              className="stake-validator__badge"
              data-tip={supportTooltip}
            >
              Featured
            </span>
          )}
        </div>
        <span
          className="stake-validator__address"
          title={element.publicKey}
        >
          {element.publicKey}
        </span>
      </div>
    </div>
  );

  const actionButton = (
    <Button
      className="stake-validator__action"
      text={buttonText}
      style={buttonStyle}
      variant={buttonVariant}
      loading={isButtonLoading}
      disableAnimation={!!isDelegating}
      disableHoverStyle={!!isDelegating}
      onClick={buttonHandler}
      disabled={!!isDelegating}
    />
  );

  if (mode === 'card') {
    return (
      <article
        className={`stake-card${isBoosted ? ' stake-card--boosted' : ''}`}
        data-tip={supportTooltip}
      >
        <div className="stake-card__header">
          {validatorIdentity}
          {actionButton}
        </div>

        <div className="stake-card__grid">
          <div className="stake-card__metric">
            <span className="stake-card__label">Fee</span>
            <strong className="stake-card__value">{element.fee}%</strong>
          </div>
          <div className="stake-card__metric">
            <span className="stake-card__label">Staked</span>
            <strong className="stake-card__value">{formatStakedAmount(element.stakedSum)}</strong>
          </div>
          <div className="stake-card__metric stake-card__metric--wide">
            <span className="stake-card__label">Info</span>
            {element.website ? (
              <a
                className="stake-card__link"
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
              >
                {websiteLabel}
              </a>
            ) : (
              <span className="stake-card__muted">{websiteLabel}</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <tr
      className={`stake-row${isBoosted ? ' stake-row--boosted' : ''}`}
      data-tip={supportTooltip}
    >
      <td className="stake-row__cell stake-row__cell--validator">{validatorIdentity}</td>
      <td className="stake-row__cell">
        <span className="stake-row__value">{element.fee}%</span>
      </td>
      <td className="stake-row__cell">
        <span className="stake-row__value">{formatStakedAmount(element.stakedSum)}</span>
      </td>
      <td className="stake-row__cell">
        {element.website ? (
          <a
            className="stake-row__link"
            href={websiteHref}
            target="_blank"
            rel="noreferrer"
          >
            {websiteLabel}
          </a>
        ) : (
          <span className="stake-row__muted">{websiteLabel}</span>
        )}
      </td>
      <td className="stake-row__cell stake-row__cell--action">{actionButton}</td>
    </tr>
  );
};

export default StakeTableRow;
