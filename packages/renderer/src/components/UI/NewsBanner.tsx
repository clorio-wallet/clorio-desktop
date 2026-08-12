import {Row, Col} from 'react-bootstrap';
import type {INewsData} from '../../types/NewsData';
import {isEmptyObject, openLinkOnBrowser} from '../../tools/utils';
import Button from './Button';

const NewsBanner = (props: INewsData) => {
  const {title, subtitle, link, cta} = props;

  return !isEmptyObject(props) ? (
    <div className="glass-card p-4 mb-4 news-banner-reveal">
      <Row>
        <Col
          md={8}
          lg={8}
          xl={9}
        >
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </Col>
        {cta && link && (
          <Col className="align-end ml-auto pt-20p">
            {link ? (
              <a
                onClick={() => openLinkOnBrowser(link)}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  text={cta || 'Learn more'}
                  style="primary"
                  className="mx-auto text-center"
                />
              </a>
            ) : (
              <Button
                text={cta || 'Learn more'}
                style="primary"
                className="mx-auto text-center"
              />
            )}
          </Col>
        )}
      </Row>
    </div>
  ) : (
    <></>
  );
};

export default NewsBanner;
