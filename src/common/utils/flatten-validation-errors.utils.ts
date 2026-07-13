import { ValidationError } from 'class-validator';

// I18nValidationException carries a nested ValidationError tree (via .children
// for nested DTOs) instead of flat strings, so custom decorator messages must
// be pulled out of each node's `constraints` map and recursively collected.
export function flattenValidationErrors(
  errors: Array<ValidationError>,
): Array<string> {
  return errors.reduce((messages: Array<string>, err) => {
    const ownMessages = Object.values(err.constraints ?? {});
    const childMessages = err.children?.length
      ? flattenValidationErrors(err.children)
      : [];
    return messages.concat(ownMessages, childMessages);
  }, []);
}
