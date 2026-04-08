import getRole from '../aria/get-role';
import getElementSpec from '../standards/get-element-spec';
import nativeTextMethods from './native-text-methods';

/**
 * Get the accessible text using native HTML methods only
 * @param {VirtualNode} element
 * @param {Object} context
 * @property {Bool} debug Enable logging for formControlValue
 * @return {String} Accessible text
 */
export default function nativeTextAlternative(virtualNode, context = {}) {
  const { actualNode } = virtualNode;
  if (
    virtualNode.props.nodeType !== 1 ||
    ['presentation', 'none'].includes(getRole(virtualNode))
  ) {
    return '';
  }

  const textMethods = findTextMethods(virtualNode);
  // Find the first step that returns a non-empty string
  const accessibleName = textMethods.reduce((accName, step) => {
    return accName || step(virtualNode, context);
  }, '');

  if (context.debug) {
    axe.log(accessibleName || '{empty-value}', actualNode, context);
  }
  return accessibleName;
}

/**
 * Get accessible text functions for a specific native HTML element
 * @private
 * @param {VirtualNode} element
 * @return {Function[]} Array of native accessible name computation methods
 */
function findTextMethods(virtualNode) {
  const elmSpec = getElementSpec(virtualNode, { noMatchAccessibleName: true });
  const methods = [...(elmSpec.namingMethods || [])];

  // Form-associated custom elements participate in label association
  // just like native form controls. When a custom element has
  // `static formAssociated = true` and labelText is not already a
  // naming method, add it so the accessible name algorithm can find
  // the associated labels.
  if (
    !methods.includes('labelText') &&
    isFormAssociatedCustomElement(virtualNode)
  ) {
    methods.push('labelText');
  }

  return methods.map(methodName => nativeTextMethods[methodName]);
}

/**
 * Check if a virtual node is a form-associated custom element.
 *
 * Form-associated custom elements set `static formAssociated = true`
 * on their class definition.  The `labels` property lives on the
 * `ElementInternals` object (returned by `attachInternals()`), which
 * is private to the component, so we detect form-association via the
 * static class property instead.
 * @private
 * @param {VirtualNode} virtualNode
 * @return {Boolean}
 */
function isFormAssociatedCustomElement(virtualNode) {
  const { actualNode } = virtualNode;
  if (!actualNode) {
    return false;
  }

  // Custom element names must contain a hyphen
  if (!virtualNode.props.nodeName.includes('-')) {
    return false;
  }

  return !!actualNode.constructor?.formAssociated;
}
