// @ts-nocheck
// TODO: 1. Add default fields recursively
// TODO: 2. Add default fields for all selections (not just fragments)
// TODO: 3. Add stylesheet and remove inline styles
// TODO: 4. Indication of when query in explorer diverges from query in editor pane
// TODO: 5. Separate section for deprecated args, with support for 'beta' fields
// TODO: 6. Custom default arg fields

// Note: Attempted 1. and 2., but they were more annoying than helpful

import * as React from "react";

import {
  getNamedType,
  GraphQLObjectType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isLeafType,
  isNonNullType,
  isObjectType,
  isRequiredInputField,
  isScalarType,
  isUnionType,
  isWrappingType,
  parse,
  print,
} from "graphql";

import {
  ArgumentNode,
  DocumentNode,
  FieldNode,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  InlineFragmentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  ObjectValueNode,
  SelectionNode,
  SelectionSetNode,
  ValueNode,
} from "graphql";
import * as gql from "graphql-ast-types";
import { createContext } from "create-hook-context";

type Field = GraphQLField<any, any>;

type GetDefaultScalarArgValue = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  underlyingArgType: GraphQLEnumType | GraphQLScalarType
) => ValueNode;

type MakeDefaultArg = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField
) => boolean;

type Colors = {
  keyword: string;
  def: string;
  property: string;
  qualifier: string;
  attribute: string;
  number: string;
  string: string;
  builtin: string;
  string2: string;
  variable: string;
  atom: string;
};

type StyleMap = {
  [key: string]: any;
};

type Styles = {
  explorerActionsStyle: StyleMap;
  buttonStyle: StyleMap;
};

type StyleConfig = {
  colors: Colors;
  arrowOpen: React.ReactNode;
  arrowClosed: React.ReactNode;
  checkboxChecked: React.ReactNode;
  checkboxUnchecked: React.ReactNode;
  styles: Styles;
};

type OperationType = "query" | "mutation" | "subscription" | "fragment";
type NewOperationType = "query" | "mutation" | "subscription";

type State = {
  operation: OperationDefinitionNode | null | undefined;
  newOperationType: NewOperationType;
  operationToScrollTo: string | null | undefined;
};

type Selections = ReadonlyArray<SelectionNode>;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Names match class names in graphiql app.css
// https://github.com/graphql/graphiql/blob/master/packages/graphiql/css/app.css
const defaultColors: Colors = {
  keyword: "#B11A04",
  // OperationName, FragmentName
  def: "#D2054E",
  // FieldName
  property: "#1F61A0",
  // FieldAlias
  qualifier: "#1C92A9",
  // ArgumentName and ObjectFieldName
  attribute: "#8B2BB9",
  number: "#2882F9",
  string: "#D64292",
  // Boolean
  builtin: "#D47509",
  // Enum
  string2: "#0B7FC7",
  variable: "#397D13",
  // Type
  atom: "#CA9800",
};

const defaultArrowOpen = (
  <svg width="12px" height="9px">
    <path fill="#666" d="M 0 2 L 9 2 L 4.5 7.5 z" />
  </svg>
);

const defaultArrowClosed = (
  <svg width="12px" height="9px">
    <path fill="#666" d="M 0 0 L 0 9 L 5.5 4.5 z" />
  </svg>
);

const defaultCheckboxChecked = (
  <svg
    style={{ marginRight: "3px", marginLeft: "-3px" }}
    width="12px"
    height="12px"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
      fill="#666"
    />
  </svg>
);

const defaultCheckboxUnchecked = (
  <svg
    style={{ marginRight: "3px", marginLeft: "-3px" }}
    width="12px"
    height="12px"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
      fill="#CCC"
    />
  </svg>
);

function Checkbox(props: { checked: boolean; styleConfig: StyleConfig }) {
  return props.checked
    ? props.styleConfig.checkboxChecked
    : props.styleConfig.checkboxUnchecked;
}

function defaultGetDefaultFieldNames(type: GraphQLObjectType): Array<string> {
  const fields = type.getFields();

  // Is there an `id` field?
  if (fields["id"]) {
    const res = ["id"];
    if (fields["email"]) {
      res.push("email");
    } else if (fields["name"]) {
      res.push("name");
    }
    return res;
  }

  // Is there an `edges` field?
  if (fields["edges"]) {
    return ["edges"];
  }

  // Is there an `node` field?
  if (fields["node"]) {
    return ["node"];
  }

  if (fields["nodes"]) {
    return ["nodes"];
  }

  // Include all leaf-type fields.
  const leafFieldNames = [];
  Object.keys(fields).forEach((fieldName) => {
    if (isLeafType(fields[fieldName].type)) {
      leafFieldNames.push(fieldName);
    }
  });

  if (!leafFieldNames.length) {
    // No leaf fields, add typename so that the query stays valid
    return ["__typename"];
  }
  return leafFieldNames.slice(0, 2); // Prevent too many fields from being added
}

function isRequiredArgument(arg: GraphQLArgument): boolean {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

function unwrapOutputType(outputType: GraphQLOutputType): any {
  let unwrappedType = outputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

function unwrapInputType(inputType: GraphQLInputType): any {
  let unwrappedType = inputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

function coerceArgValue(
  argType: GraphQLScalarType | GraphQLEnumType,
  value: string
): ValueNode {
  if (isScalarType(argType)) {
    try {
      switch (argType.name) {
        case "String":
          return {
            kind: "StringValue",
            value: String(argType.parseValue(value)),
          };
        case "Float":
          return {
            kind: "FloatValue",
            value: String(argType.parseValue(parseFloat(value))),
          };
        case "Int":
          return {
            kind: "IntValue",
            value: String(argType.parseValue(parseInt(value, 10))),
          };
        case "Boolean":
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === "boolean") {
              return { kind: "BooleanValue", value: parsed };
            } else {
              return { kind: "BooleanValue", value: false };
            }
          } catch (e) {
            return {
              kind: "BooleanValue",
              value: false,
            };
          }

        default:
          return {
            kind: "StringValue",
            value: String(argType.parseValue(value)),
          };
      }
    } catch (e) {
      console.error("error coercing arg value", e, value);
      return { kind: "StringValue", value: value };
    }
  } else {
    try {
      const parsedValue = argType.parseValue(value);
      if (parsedValue) {
        return { kind: "EnumValue", value: String(parsedValue) };
      } else {
        return { kind: "EnumValue", value: argType.getValues()[0].name };
      }
    } catch (e) {
      return { kind: "EnumValue", value: argType.getValues()[0].name };
    }
  }
}

type InputArgViewProps = {
  arg: GraphQLArgument;
  selection: ObjectValueNode;
  parentField: Field;
  modifyFields: (fields: ReadonlyArray<ObjectFieldNode>) => void;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

class InputArgView extends React.PureComponent<InputArgViewProps, {}> {
  _previousArgSelection: ObjectFieldNode | null | undefined;
  _getArgSelection = () => {
    return this.props.selection.fields.find(
      (field) => field.name.value === this.props.arg.name
    );
  };

  _removeArg = () => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    this.props.modifyFields(
      selection.fields.filter((field) => field !== argSelection)
    );
  };

  _addArg = () => {
    const {
      selection,
      arg,
      getDefaultScalarArgValue,
      parentField,
      makeDefaultArg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection = null;
    if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: "ObjectField",
        name: { kind: "Name", value: arg.name },
        value: {
          kind: "ObjectValue",
          fields: defaultInputObjectFields(
            getDefaultScalarArgValue,
            makeDefaultArg,
            parentField,
            Object.keys(fields).map((k) => fields[k])
          ),
        },
      };
    } else if (isLeafType(argType)) {
      argSelection = {
        kind: "ObjectField",
        name: { kind: "Name", value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      };
    }

    if (!argSelection) {
      console.error("Unable to add arg for argType", argType);
    } else {
      this.props.modifyFields([...(selection.fields || []), argSelection]);
    }
  };

  _setArgValue = (event) => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection) {
      console.error("missing arg selection when setting arg value");
      return;
    }
    const argType = unwrapInputType(this.props.arg.type);
    if (!isLeafType(argType)) {
      console.warn("Unable to handle non leaf types in setArgValue");
      return;
    }
    const targetValue = event.target.value;

    this.props.modifyFields(
      (selection.fields || []).map((field) =>
        field === argSelection
          ? {
              ...field,
              value: coerceArgValue(argType, targetValue),
            }
          : field
      )
    );
  };

  _modifyChildFields = (fields) => {
    this.props.modifyFields(
      this.props.selection.fields.map((field) =>
        field.name.value === this.props.arg.name
          ? {
              ...field,
              value: {
                kind: "ObjectValue",
                fields: fields,
              },
            }
          : field
      )
    );
  };

  render() {
    const { arg, parentField } = this.props;
    const argSelection = this._getArgSelection();

    return (
      <AbstractArgView
        argValue={argSelection ? argSelection.value : null}
        arg={arg}
        parentField={parentField}
        addArg={this._addArg}
        removeArg={this._removeArg}
        setArgFields={this._modifyChildFields}
        setArgValue={this._setArgValue}
        getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
        makeDefaultArg={this.props.makeDefaultArg}
        onRunOperation={this.props.onRunOperation}
        styleConfig={this.props.styleConfig}
      />
    );
  }
}

type ArgViewProps = {
  parentField: Field;
  arg: GraphQLArgument;
  selection: FieldNode;
  modifyArguments: (argumentNodes: ReadonlyArray<ArgumentNode>) => void;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

type ArgViewState = {};

export function defaultValue(
  argType: GraphQLEnumType | GraphQLScalarType
): ValueNode {
  if (isEnumType(argType)) {
    return { kind: "EnumValue", value: argType.getValues()[0].name };
  } else {
    switch (argType.name) {
      case "String":
        return { kind: "StringValue", value: "" };
      case "Float":
        return { kind: "FloatValue", value: "1.5" };
      case "Int":
        return { kind: "IntValue", value: "10" };
      case "Boolean":
        return { kind: "BooleanValue", value: false };
      default:
        return { kind: "StringValue", value: "" };
    }
  }
}

function defaultGetDefaultScalarArgValue(
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  argType: GraphQLEnumType | GraphQLScalarType
): ValueNode {
  return defaultValue(argType);
}

class ArgView extends React.PureComponent<ArgViewProps, ArgViewState> {
  _previousArgSelection: ArgumentNode | null | undefined;
  _getArgSelection = () => {
    const { selection } = this.props;

    return (selection.arguments || []).find(
      (arg) => arg.name.value === this.props.arg.name
    );
  };
  _removeArg = () => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    this.props.modifyArguments(
      (selection.arguments || []).filter((arg) => arg !== argSelection)
    );
  };
  _addArg = (event) => {
    const {
      selection,
      getDefaultScalarArgValue,
      makeDefaultArg,
      parentField,
      arg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection = null;
    if (event.altKey && event.shiftKey) {
      argSelection = {
        kind: "Argument",
        name: { kind: "Name", value: arg.name },
        value: gql.variable(gql.name(arg.name)),
      };
    } else if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: "Argument",
        name: { kind: "Name", value: arg.name },
        value: {
          kind: "ObjectValue",
          fields: defaultInputObjectFields(
            getDefaultScalarArgValue,
            makeDefaultArg,
            parentField,
            Object.keys(fields).map((k) => fields[k])
          ),
        },
      };
    } else if (isLeafType(argType)) {
      argSelection = {
        kind: "Argument",
        name: { kind: "Name", value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      };
    }

    if (!argSelection) {
      console.error("Unable to add arg for argType", argType);
    } else {
      this.props.modifyArguments([
        ...(selection.arguments || []),
        argSelection,
      ]);
    }
  };
  _setArgValue = (event) => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection) {
      console.error("missing arg selection when setting arg value");
      return;
    }
    const argType = unwrapInputType(this.props.arg.type);
    if (!isLeafType(argType)) {
      console.warn("Unable to handle non leaf types in setArgValue");
      return;
    }

    const targetValue = event.target.value;

    this.props.modifyArguments(
      (selection.arguments || []).map((a) =>
        a === argSelection
          ? {
              ...a,
              value: coerceArgValue(argType, targetValue),
            }
          : a
      )
    );
  };

  _setArgFields = (fields) => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection) {
      console.error("missing arg selection when setting arg value");
      return;
    }

    this.props.modifyArguments(
      (selection.arguments || []).map((a) =>
        a === argSelection
          ? {
              ...a,
              value: {
                kind: "ObjectValue",
                fields,
              },
            }
          : a
      )
    );
  };

  render() {
    const { arg, parentField } = this.props;
    const argSelection = this._getArgSelection();

    return (
      <AbstractArgView
        argValue={argSelection ? argSelection.value : null}
        arg={arg}
        parentField={parentField}
        addArg={this._addArg}
        removeArg={this._removeArg}
        setArgFields={this._setArgFields}
        setArgValue={this._setArgValue}
        getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
        makeDefaultArg={this.props.makeDefaultArg}
        onRunOperation={this.props.onRunOperation}
        styleConfig={this.props.styleConfig}
      />
    );
  }
}

function isRunShortcut(event) {
  return event.ctrlKey && event.key === "Enter";
}

function canRunOperation(operationName) {
  // it does not make sense to try to execute a fragment
  return operationName !== "FragmentDefinition";
}

type AbstractArgViewProps = {
  argValue: ValueNode | null | undefined;
  arg: GraphQLArgument;
  parentField: Field;
  setArgValue: React.ChangeEventHandler;
  setArgFields: (fields: ReadonlyArray<ObjectFieldNode>) => void;
  addArg: () => void;
  removeArg: () => void;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

type ScalarInputProps = {
  arg: GraphQLArgument;
  argValue: ValueNode;
  setArgValue: React.ChangeEventHandler;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

class ScalarInput extends React.PureComponent<ScalarInputProps, {}> {
  _ref: any | null | undefined;
  _handleChange = (event) => {
    this.props.setArgValue(event);
  };

  componentDidMount() {
    const input = this._ref;
    const activeElement = document.activeElement;
    if (
      input &&
      activeElement &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      input.focus();
      input.setSelectionRange(0, input.value.length);
    }
  }

  render() {
    const { arg, argValue, styleConfig } = this.props;
    const argType = unwrapInputType(arg.type);
    const value = typeof argValue.value === "string" ? argValue.value : "";
    const color =
      this.props.argValue.kind === "StringValue"
        ? styleConfig.colors.string
        : styleConfig.colors.number;
    return (
      <span style={{ color }}>
        {argType.name === "String" ? '"' : ""}
        <input
          style={{
            border: "none",
            borderBottom: "1px solid #888",
            outline: "none",
            width: `${Math.max(1, value.length)}ch`,
            color,
          }}
          ref={(ref) => {
            this._ref = ref;
          }}
          type="text"
          onChange={this._handleChange}
          value={value}
        />
        {argType.name === "String" ? '"' : ""}
      </span>
    );
  }
}

class AbstractArgView extends React.PureComponent<AbstractArgViewProps, {}> {
  render() {
    const { argValue, arg, styleConfig } = this.props;

    /* TODO: handle List types*/
    const argType = unwrapInputType(arg.type);

    let input = null;
    if (argValue) {
      // if (argValue.kind === 'Variable') {
      //   input = (
      //     <span style={{ color: styleConfig.colors.variable }}>
      //       ${argValue.name.value}
      //     </span>
      //   );
      // } else
      if (isScalarType(argType)) {
        if (argType.name === "Boolean") {
          input = (
            <select
              style={{
                color: styleConfig.colors.builtin,
              }}
              onChange={this.props.setArgValue}
              value={
                argValue.kind === "BooleanValue" ? argValue.value : undefined
              }
            >
              <option key="true" value="true">
                true
              </option>
              <option key="false" value="false">
                false
              </option>
            </select>
          );
        } else {
          input = (
            <ScalarInput
              setArgValue={this.props.setArgValue}
              arg={arg}
              argValue={argValue}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
            />
          );
        }
      } else if (isEnumType(argType)) {
        if (argValue.kind === "EnumValue") {
          input = (
            <select
              style={{
                backgroundColor: "white",
                color: styleConfig.colors.string2,
              }}
              onChange={this.props.setArgValue}
              value={argValue.value}
            >
              {argType.getValues().map((value) => (
                <option key={value.name} value={value.name}>
                  {value.name}
                </option>
              ))}
            </select>
          );
        } else {
          console.error(
            "arg mismatch between arg and selection",
            argType,
            argValue
          );
        }
      } else if (isInputObjectType(argType)) {
        if (argValue.kind === "ObjectValue") {
          const fields = argType.getFields();
          input = (
            <div style={{ marginLeft: 16 }}>
              {Object.keys(fields)
                .sort()
                .map((fieldName) => (
                  <InputArgView
                    key={fieldName}
                    arg={fields[fieldName]}
                    parentField={this.props.parentField}
                    selection={argValue}
                    modifyFields={this.props.setArgFields}
                    getDefaultScalarArgValue={
                      this.props.getDefaultScalarArgValue
                    }
                    makeDefaultArg={this.props.makeDefaultArg}
                    onRunOperation={this.props.onRunOperation}
                    styleConfig={this.props.styleConfig}
                  />
                ))}
            </div>
          );
        } else {
          console.error(
            "arg mismatch between arg and selection",
            argType,
            argValue
          );
        }
      }
    }

    return (
      <div
        style={{
          cursor: "pointer",
          minHeight: "16px",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        data-arg-name={arg.name}
        data-arg-type={argType.name}
      >
        <span
          style={{ cursor: "pointer" }}
          onClick={argValue ? this.props.removeArg : this.props.addArg}
        >
          {isInputObjectType(argType) ? (
            <span>
              {!!argValue
                ? this.props.styleConfig.arrowOpen
                : this.props.styleConfig.arrowClosed}
            </span>
          ) : (
            <Checkbox
              checked={!!argValue}
              styleConfig={this.props.styleConfig}
            />
          )}
          <span
            style={{ color: styleConfig.colors.attribute }}
            title={arg.description}
          >
            {argValue && argValue.kind === "Variable" ? "$" : ""}
            {arg.name}
            {isRequiredArgument(arg) ? "*" : ""}:
          </span>
        </span>{" "}
        {input || <span />}
      </div>
    );
  }
}

type AbstractViewProps = {
  implementingType: GraphQLObjectType;
  selections: Selections;
  modifySelections: (selections: Selections) => void;
  schema: GraphQLSchema;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

class AbstractView extends React.PureComponent<AbstractViewProps, {}> {
  _previousSelection: InlineFragmentNode | null | undefined;
  _addFragment = () => {
    this.props.modifySelections([
      ...this.props.selections,
      this._previousSelection || {
        kind: "InlineFragment",
        typeCondition: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: this.props.implementingType.name,
          },
        },
        selectionSet: {
          kind: "SelectionSet",
          selections: this.props
            .getDefaultFieldNames(this.props.implementingType)
            .map((fieldName) => ({
              kind: "Field",
              name: { kind: "Name", value: fieldName },
            })),
        },
      },
    ]);
  };
  _removeFragment = () => {
    const thisSelection = this._getSelection();
    this._previousSelection = thisSelection;
    this.props.modifySelections(
      this.props.selections.filter((s) => s !== thisSelection)
    );
  };
  _getSelection = (): InlineFragmentNode | null | undefined => {
    const selection = this.props.selections.find(
      (selection) =>
        selection.kind === "InlineFragment" &&
        selection.typeCondition &&
        this.props.implementingType.name === selection.typeCondition.name.value
    );
    if (!selection) {
      return null;
    }
    if (selection.kind === "InlineFragment") {
      return selection;
    }
  };

  _modifyChildSelections = (selections: Selections) => {
    const thisSelection = this._getSelection();
    this.props.modifySelections(
      this.props.selections.map((selection) => {
        if (selection === thisSelection) {
          return {
            directives: selection.directives,
            kind: "InlineFragment",
            typeCondition: {
              kind: "NamedType",
              name: {
                kind: "Name",
                value: this.props.implementingType.name,
              },
            },
            selectionSet: {
              kind: "SelectionSet",
              selections,
            },
          };
        }
        return selection;
      })
    );
  };

  render() {
    const {
      implementingType,
      schema,
      getDefaultFieldNames,
      styleConfig,
    } = this.props;
    const selection = this._getSelection();
    const fields = implementingType.getFields();
    const childSelections = selection
      ? selection.selectionSet
        ? selection.selectionSet.selections
        : []
      : [];
    return (
      <div>
        <span
          style={{ cursor: "pointer" }}
          onClick={selection ? this._removeFragment : this._addFragment}
        >
          <Checkbox
            checked={!!selection}
            styleConfig={this.props.styleConfig}
          />
          <span style={{ color: styleConfig.colors.atom }}>
            {this.props.implementingType.name}
          </span>
        </span>
        {selection ? (
          <div style={{ marginLeft: 16 }}>
            {Object.keys(fields)
              .sort()
              .map((fieldName) => (
                <FieldView
                  key={fieldName}
                  field={fields[fieldName]}
                  selections={childSelections}
                  modifySelections={this._modifyChildSelections}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                  makeDefaultArg={this.props.makeDefaultArg}
                  onRunOperation={this.props.onRunOperation}
                  styleConfig={this.props.styleConfig}
                />
              ))}
          </div>
        ) : null}
      </div>
    );
  }
}

type FieldViewProps = {
  field: Field;
  selections: Selections;
  modifySelections: (selections: Selections) => void;
  schema: GraphQLSchema;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  onRunOperation: (arg0: void) => void;
  styleConfig: StyleConfig;
};

function defaultInputObjectFields(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg | null | undefined,
  parentField: Field,
  fields: Array<GraphQLInputField>
): Array<ObjectFieldNode> {
  const nodes = [];
  for (const field of fields) {
    if (
      isRequiredInputField(field) ||
      (makeDefaultArg && makeDefaultArg(parentField, field))
    ) {
      const fieldType = unwrapInputType(field.type);
      if (isInputObjectType(fieldType)) {
        const fields = fieldType.getFields();
        nodes.push({
          kind: "ObjectField",
          name: { kind: "Name", value: field.name },
          value: {
            kind: "ObjectValue",
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              parentField,
              Object.keys(fields).map((k) => fields[k])
            ),
          },
        });
      } else if (isLeafType(fieldType)) {
        nodes.push({
          kind: "ObjectField",
          name: { kind: "Name", value: field.name },
          value: getDefaultScalarArgValue(parentField, field, fieldType),
        });
      }
    }
  }
  return nodes;
}

function defaultArgs(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg | null | undefined,
  field: Field
): Array<ArgumentNode> {
  const args = [];
  for (const arg of field.args) {
    if (
      isRequiredArgument(arg) ||
      (makeDefaultArg && makeDefaultArg(field, arg))
    ) {
      const argType = unwrapInputType(arg.type);
      if (isInputObjectType(argType)) {
        const fields = argType.getFields();
        args.push({
          kind: "Argument",
          name: { kind: "Name", value: arg.name },
          value: {
            kind: "ObjectValue",
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              field,
              Object.keys(fields).map((k) => fields[k])
            ),
          },
        });
      } else if (isLeafType(argType)) {
        args.push({
          kind: "Argument",
          name: { kind: "Name", value: arg.name },
          value: getDefaultScalarArgValue(field, arg, argType),
        });
      }
    }
  }
  return args;
}

class FieldView extends React.PureComponent<FieldViewProps, {}> {
  _previousSelection: SelectionNode | null | undefined;
  _addAllFieldsToSelections = (rawSubfields) => {
    const subFields: Array<FieldNode> = !!rawSubfields
      ? Object.keys(rawSubfields).map((fieldName) => {
          return {
            kind: "Field",
            name: { kind: "Name", value: fieldName },
            arguments: [],
          };
        })
      : [];

    const subSelectionSet: SelectionSetNode = {
      kind: "SelectionSet",
      selections: subFields,
    };

    const nextSelections = [
      ...this.props.selections.filter((selection) => {
        if (selection.kind === "InlineFragment") {
          return true;
        } else {
          // Remove the current selection set for the target field
          return selection.name.value !== this.props.field.name;
        }
      }),
      {
        kind: "Field",
        name: { kind: "Name", value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field
        ),
        selectionSet: subSelectionSet,
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _addFieldToSelections = (rawSubfields) => {
    const nextSelections = [
      ...this.props.selections,
      this._previousSelection || {
        kind: "Field",
        name: { kind: "Name", value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field
        ),
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _handleUpdateSelections = (event) => {
    const selection = this._getSelection();
    if (selection && !event.altKey) {
      this._removeFieldFromSelections();
    } else {
      const fieldType = getNamedType(this.props.field.type);
      const rawSubfields = isObjectType(fieldType) && fieldType.getFields();

      const shouldSelectAllSubfields = !!rawSubfields && event.altKey;

      shouldSelectAllSubfields
        ? this._addAllFieldsToSelections(rawSubfields)
        : this._addFieldToSelections(rawSubfields);
    }
  };

  _removeFieldFromSelections = () => {
    const previousSelection = this._getSelection();
    this._previousSelection = previousSelection;
    this.props.modifySelections(
      this.props.selections.filter(
        (selection) => selection !== previousSelection
      )
    );
  };
  _getSelection = (): FieldNode | null | undefined => {
    const selection = this.props.selections.find(
      (selection) =>
        selection.kind === "Field" &&
        this.props.field.name === selection.name.value
    );
    if (!selection) {
      return null;
    }
    if (selection.kind === "Field") {
      return selection;
    }
  };

  _setArguments = (argumentNodes: ReadonlyArray<ArgumentNode>) => {
    const selection = this._getSelection();
    if (!selection) {
      console.error("Missing selection when setting arguments", argumentNodes);
      return;
    }
    this.props.modifySelections(
      this.props.selections.map((s) =>
        s === selection
          ? {
              alias: selection.alias,
              arguments: argumentNodes,
              directives: selection.directives,
              kind: "Field",
              name: selection.name,
              selectionSet: selection.selectionSet,
            }
          : s
      )
    );
  };

  _modifyChildSelections = (selections: Selections) => {
    this.props.modifySelections(
      this.props.selections.map((selection) => {
        if (
          selection.kind === "Field" &&
          this.props.field.name === selection.name.value
        ) {
          if (selection.kind !== "Field") {
            throw new Error("invalid selection");
          }
          return {
            alias: selection.alias,
            arguments: selection.arguments,
            directives: selection.directives,
            kind: "Field",
            name: selection.name,
            selectionSet: {
              kind: "SelectionSet",
              selections,
            },
          };
        }
        return selection;
      })
    );
  };

  render() {
    const { field, schema, getDefaultFieldNames, styleConfig } = this.props;
    const selection = this._getSelection();
    const type = unwrapOutputType(field.type);
    const args = field.args.sort((a, b) => a.name.localeCompare(b.name));
    let className = "graphiql-explorer-node";

    if (field.isDeprecated) {
      className += " graphiql-explorer-deprecated";
    }

    const node = (
      <div className={className}>
        <span
          title={field.description}
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "16px",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          data-field-name={field.name}
          data-field-type={type.name}
          onClick={this._handleUpdateSelections}
        >
          {isObjectType(type) ? (
            <span>
              {!!selection
                ? this.props.styleConfig.arrowOpen
                : this.props.styleConfig.arrowClosed}
            </span>
          ) : null}
          {isObjectType(type) ? null : (
            <Checkbox
              checked={!!selection}
              styleConfig={this.props.styleConfig}
            />
          )}
          <span
            style={{ color: styleConfig.colors.property }}
            className="graphiql-explorer-field-view"
          >
            {field.name}
          </span>
        </span>
        {selection && args.length ? (
          <div style={{ marginLeft: 16 }}>
            {args.map((arg) => (
              <ArgView
                key={arg.name}
                parentField={field}
                arg={arg}
                selection={selection}
                modifyArguments={this._setArguments}
                getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                makeDefaultArg={this.props.makeDefaultArg}
                onRunOperation={this.props.onRunOperation}
                styleConfig={this.props.styleConfig}
              />
            ))}
          </div>
        ) : null}
      </div>
    );

    if (
      selection &&
      (isObjectType(type) || isInterfaceType(type) || isUnionType(type))
    ) {
      const fields = isUnionType(type) ? {} : type.getFields();
      const childSelections = selection
        ? selection.selectionSet
          ? selection.selectionSet.selections
          : []
        : [];
      return (
        <div>
          {node}
          <div style={{ marginLeft: 16 }}>
            {Object.keys(fields)
              .sort()
              .map((fieldName) => (
                <FieldView
                  key={fieldName}
                  field={fields[fieldName]}
                  selections={childSelections}
                  modifySelections={this._modifyChildSelections}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                  makeDefaultArg={this.props.makeDefaultArg}
                  onRunOperation={this.props.onRunOperation}
                  styleConfig={this.props.styleConfig}
                />
              ))}
            {isInterfaceType(type) || isUnionType(type)
              ? schema
                  .getPossibleTypes(type)
                  .map((type) => (
                    <AbstractView
                      key={type.name}
                      implementingType={type}
                      selections={childSelections}
                      modifySelections={this._modifyChildSelections}
                      schema={schema}
                      getDefaultFieldNames={getDefaultFieldNames}
                      getDefaultScalarArgValue={
                        this.props.getDefaultScalarArgValue
                      }
                      makeDefaultArg={this.props.makeDefaultArg}
                      onRunOperation={this.props.onRunOperation}
                      styleConfig={this.props.styleConfig}
                    />
                  ))
              : null}
          </div>
        </div>
      );
    }
    return node;
  }
}

function parseQuery(text: string): (DocumentNode | null | undefined) | Error {
  try {
    if (!text.trim()) {
      return null;
    }
    return parse(
      text, // Tell graphql to not bother track locations when parsing, we don't need
      // it and it's a tiny bit more expensive.
      { noLocation: true }
    );
  } catch (e) {
    return new Error(e);
  }
}

const DEFAULT_OPERATION = {
  kind: "OperationDefinition",
  operation: "query",
  variableDefinitions: [],
  name: { kind: "Name", value: "MyQuery" },
  directives: [],
  selectionSet: {
    kind: "SelectionSet",
    selections: [],
  },
};
const DEFAULT_DOCUMENT = {
  kind: "Document",
  definitions: [DEFAULT_OPERATION],
};
let parseQueryMemoize: [string, DocumentNode] | null | undefined = null;
function memoizeParseQuery(query: string): DocumentNode {
  if (parseQueryMemoize && parseQueryMemoize[0] === query) {
    return parseQueryMemoize[1];
  } else {
    const result = parseQuery(query);
    if (!result) {
      return DEFAULT_DOCUMENT;
    } else if (result instanceof Error) {
      if (parseQueryMemoize) {
        // Most likely a temporarily invalid query while they type
        return parseQueryMemoize[1];
      } else {
        return DEFAULT_DOCUMENT;
      }
    } else {
      parseQueryMemoize = [query, result];
      return result;
    }
  }
}

const defaultStyles = {
  buttonStyle: {
    fontSize: "1.2em",
    padding: "0px",
    backgroundColor: "white",
    border: "none",
    margin: "5px 0px",
    height: "40px",
    width: "100%",
    display: "block",
    maxWidth: "none",
  },

  explorerActionsStyle: {
    margin: "4px -8px -8px",
    paddingLeft: "8px",
    bottom: "0px",
    width: "100%",
    textAlign: "center",
    background: "none",
    borderTop: "none",
    borderBottom: "none",
  },
};

type RootViewProps = {
  schema: GraphQLSchema;
  isLast: boolean;
  fields: GraphQLFieldMap<any, any> | null | undefined;
  operation: OperationType;
  name: string | null | undefined;
  onTypeName: string | null | undefined;
  definition: FragmentDefinitionNode | OperationDefinitionNode;
  onEdit: (
    operationDef:
      | (OperationDefinitionNode | null | undefined)
      | (FragmentDefinitionNode | null | undefined)
  ) => void;
  onOperationRename: (query: string) => void;
  onRunOperation: (name: string | null | undefined) => void;
  onMount: (rootViewElId: string) => void;
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>;
  getDefaultScalarArgValue: GetDefaultScalarArgValue;
  makeDefaultArg: MakeDefaultArg | null | undefined;
  styleConfig: StyleConfig;
};

class RootView extends React.PureComponent<RootViewProps, {}> {
  state = { newOperationType: "query" };
  _previousOperationDef:
    | (OperationDefinitionNode | null | undefined)
    | (FragmentDefinitionNode | null | undefined);

  _modifySelections = (selections: Selections) => {
    let operationDef: FragmentDefinitionNode | OperationDefinitionNode = this
      .props.definition;

    if (
      operationDef.selectionSet.selections.length === 0 &&
      this._previousOperationDef
    ) {
      operationDef = this._previousOperationDef;
    }

    let newOperationDef:
      | (OperationDefinitionNode | null | undefined)
      | (FragmentDefinitionNode | null | undefined);

    if (operationDef.kind === "FragmentDefinition") {
      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections,
        },
      };
    } else if (operationDef.kind === "OperationDefinition") {
      let cleanedSelections = selections.filter((selection) => {
        return !(
          selection.kind === "Field" && selection.name.value === "__typename"
        );
      });

      if (cleanedSelections.length === 0) {
        cleanedSelections = [
          {
            kind: "Field",
            name: {
              kind: "Name",
              value: "__typename ## Placeholder value",
            },
          },
        ];
      }

      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections: cleanedSelections,
        },
      };
    }

    this.props.onEdit(newOperationDef);
  };

  _onOperationRename = (event) =>
    this.props.onOperationRename(event.target.value);

  _handlePotentialRun = (event) => {
    if (isRunShortcut(event) && canRunOperation(this.props.definition.kind)) {
      this.props.onRunOperation(this.props.name);
    }
  };

  _rootViewElId = () => {
    const { operation, name } = this.props;
    const rootViewElId = `${operation}-${name || "unknown"}`;
    return rootViewElId;
  };

  componentDidMount() {
    const rootViewElId = this._rootViewElId();

    this.props.onMount(rootViewElId);
  }

  render() {
    const {
      operation,
      definition,
      schema,
      getDefaultFieldNames,
      styleConfig,
    } = this.props;
    const rootViewElId = this._rootViewElId();

    const fields = this.props.fields || {};
    const operationDef = definition;
    const selections = operationDef.selectionSet.selections;

    const operationDisplayName =
      this.props.name || `${capitalize(operation)} Name`;

    return (
      <div
        id={rootViewElId}
        style={{
          // The actions bar has its own top border
          outline: "none",
          borderBottom: this.props.isLast ? "none" : "1px solid #d6d6d6",
          marginBottom: "0em",
          paddingBottom: "1em",
          paddingTop: "0.5em",
        }}
        tabIndex="0"
        onKeyDown={this._handlePotentialRun}
      >
        <div
          style={{
            color: styleConfig.colors.keyword,
            paddingBottom: 4,
          }}
        >
          {operation}{" "}
          <span style={{ color: styleConfig.colors.def }}>
            <input
              style={{
                color: styleConfig.colors.def,
                border: "none",
                borderBottom: "1px solid #888",
                outline: "none",
                width: `${Math.max(4, operationDisplayName.length)}ch`,
              }}
              autoComplete="false"
              placeholder={`${capitalize(operation)} Name`}
              value={this.props.name}
              onKeyDown={this._handlePotentialRun}
              onChange={this._onOperationRename}
            />
          </span>
          {!!this.props.onTypeName ? (
            <span>
              <br />
              {`on ${this.props.onTypeName}`}
            </span>
          ) : (
            ""
          )}
        </div>

        {Object.keys(fields)
          .sort()
          .map((fieldName: string) => (
            <FieldView
              key={fieldName}
              field={fields[fieldName]}
              selections={selections}
              modifySelections={this._modifySelections}
              schema={schema}
              getDefaultFieldNames={getDefaultFieldNames}
              getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
              makeDefaultArg={this.props.makeDefaultArg}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
            />
          ))}
      </div>
    );
  }
}

function Attribution() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "1em",
        marginTop: 0,
        flexGrow: 1,
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          borderTop: "1px solid #d6d6d6",
          paddingTop: "1em",
          width: "100%",
          textAlign: "center",
        }}
      >
        GraphiQL Explorer by <a href="https://www.onegraph.com">OneGraph</a>
      </div>
      <div>
        Contribute on{" "}
        <a href="https://github.com/OneGraph/graphiql-explorer">GitHub</a>
      </div>
    </div>
  );
}

export type Props = {
  query: string;
  width?: number;
  title?: string;
  schema?: GraphQLSchema | null | undefined;
  onEdit: (arg0: string) => void;
  getDefaultFieldNames?: (
    type: GraphQLObjectType
  ) => Array<string> | null | undefined;
  getDefaultScalarArgValue?: GetDefaultScalarArgValue | null | undefined;
  makeDefaultArg?: MakeDefaultArg | null | undefined;
  onToggleExplorer?: () => void;
  explorerIsOpen: boolean;
  onRunOperation?: (name: string | null | undefined) => void;
  colors?: Colors | null | undefined;
  arrowOpen?: React.ReactNode | null | undefined;
  arrowClosed?: React.ReactNode | null | undefined;
  checkboxChecked?: React.ReactNode | null | undefined;
  checkboxUnchecked?: React.ReactNode | null | undefined;
  styles?:
    | {
        explorerActionsStyle?: StyleMap;
        buttonStyle?: StyleMap;
      }
    | null
    | undefined;
  showAttribution?: boolean;
};

createContext(
  ({
    getDefaultFieldNames = defaultGetDefaultFieldNames,
    getDefaultScalarArgValue = defaultGetDefaultScalarArgValue,
    colors = defaultColors,
    checkboxChecked = defaultCheckboxChecked,
    checkboxUnchecked = defaultCheckboxUnchecked,
    arrowClosed = defaultArrowClosed,
    arrowOpen = defaultArrowOpen,
    styles = {},
    schema,
    query,
    makeDefaultArg,
  }) => {
    const styleConfig = {
      colors,
      checkboxChecked,
      checkboxUnchecked,
      arrowClosed,
      arrowOpen,
      styles: {
        ...defaultStyles,
        ...styles,
      },
    };

    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (!queryType && !mutationType && !subscriptionType) {
      // return <div>Missing query type</div>;
    }
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    const definitions = parsedQuery.definitions;

    const _relevantOperations = definitions
      .map((definition) => {
        if (definition.kind === "FragmentDefinition") {
          return definition;
        } else if (definition.kind === "OperationDefinition") {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);

    const relevantOperations = // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      _relevantOperations.length === 0
        ? DEFAULT_DOCUMENT.definitions
        : _relevantOperations;
  }
);

export class Explorer extends React.PureComponent<Props, State> {
  static defaultProps = {
    getDefaultFieldNames: defaultGetDefaultFieldNames,
    getDefaultScalarArgValue: defaultGetDefaultScalarArgValue,
  };

  state = {
    newOperationType: "query",
    operation: null,
    operationToScrollTo: null,
  };

  _ref: any | null | undefined;
  _resetScroll = () => {
    const container = this._ref;
    if (container) {
      container.scrollLeft = 0;
    }
  };
  componentDidMount() {
    this._resetScroll();
  }

  _onEdit = (query: string): void => this.props.onEdit(query);

  _setAddOperationType = (value: NewOperationType) => {
    this.setState({ newOperationType: value });
  };

  _handleRootViewMount = (rootViewElId: string) => {
    if (
      !!this.state.operationToScrollTo &&
      this.state.operationToScrollTo === rootViewElId
    ) {
      var selector = `.graphiql-explorer-root #${rootViewElId}`;

      var el = document.querySelector(selector);
      el && el.scrollIntoView();
    }
  };

  render() {
    const { schema, query, makeDefaultArg } = this.props;

    if (!schema) {
      return (
        <div style={{ fontFamily: "sans-serif" }} className="error-container">
          No Schema Available
        </div>
      );
    }
    const styleConfig = {
      colors: this.props.colors || defaultColors,
      checkboxChecked: this.props.checkboxChecked || defaultCheckboxChecked,
      checkboxUnchecked:
        this.props.checkboxUnchecked || defaultCheckboxUnchecked,
      arrowClosed: this.props.arrowClosed || defaultArrowClosed,
      arrowOpen: this.props.arrowOpen || defaultArrowOpen,
      styles: this.props.styles
        ? {
            ...defaultStyles,
            ...this.props.styles,
          }
        : defaultStyles,
    };
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (!queryType && !mutationType && !subscriptionType) {
      return <div>Missing query type</div>;
    }
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    const getDefaultFieldNames =
      this.props.getDefaultFieldNames || defaultGetDefaultFieldNames;
    const getDefaultScalarArgValue =
      this.props.getDefaultScalarArgValue || defaultGetDefaultScalarArgValue;

    const definitions = parsedQuery.definitions;

    const _relevantOperations = definitions
      .map((definition) => {
        if (definition.kind === "FragmentDefinition") {
          return definition;
        } else if (definition.kind === "OperationDefinition") {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);

    const relevantOperations = // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      _relevantOperations.length === 0
        ? DEFAULT_DOCUMENT.definitions
        : _relevantOperations;

    const renameOperation = (targetOperation, name) => {
      const newDefinitions = parsedQuery.definitions.map(
        (existingOperation) => {
          if (targetOperation === existingOperation) {
            const newName = name == null || name === "" ? null : gql.name(name);
            return { ...targetOperation, name: newName };
          } else {
            return existingOperation;
          }
        }
      );

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const addOperation = (kind: NewOperationType) => {
      const isDefaultOperation =
        parsedQuery.definitions.length === 1 &&
        parsedQuery.definitions[0] === DEFAULT_DOCUMENT.definitions[0];

      const siblingDefinitions = isDefaultOperation
        ? []
        : parsedQuery.definitions.filter(
            (def) =>
              def.kind === "OperationDefinition" && def.operation === kind
          );

      const newOperationName = `My${capitalize(kind)}${
        siblingDefinitions.length === 0 ? "" : siblingDefinitions.length + 1
      }`;

      const newDefinition = gql.operationDefinition(
        kind,
        gql.selectionSet([gql.field(gql.name("__typename"))]),
        gql.name(newOperationName)
      );

      const newDefinitions = // If we only have our default operation in the document right now, then
        // just replace it with our new definition
        isDefaultOperation
          ? [newDefinition]
          : [...parsedQuery.definitions, newDefinition];

      const newOperationDef = {
        ...parsedQuery,
        definitions: newDefinitions,
      };

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      this.props.onEdit(print(newOperationDef));
    };

    const actionsOptions = [
      !!queryFields ? (
        <option
          key="query"
          className={"toolbar-button"}
          style={styleConfig.styles.buttonStyle}
          type="link"
          value={"query" as NewOperationType}
        >
          Query
        </option>
      ) : null,
      !!mutationFields ? (
        <option
          key="mutation"
          className={"toolbar-button"}
          style={styleConfig.styles.buttonStyle}
          type="link"
          value={"mutation" as NewOperationType}
        >
          Mutation
        </option>
      ) : null,
      !!subscriptionFields ? (
        <option
          key="subscription"
          className={"toolbar-button"}
          style={styleConfig.styles.buttonStyle}
          type="link"
          value={"subscription" as NewOperationType}
        >
          Subscription
        </option>
      ) : null,
    ].filter(Boolean);

    const actionsEl =
      actionsOptions.length === 0 ? null : (
        <div
          style={{
            minHeight: "50px",
            maxHeight: "50px",
            overflow: "none",
          }}
        >
          <form
            className="variable-editor-title graphiql-explorer-actions"
            style={{
              ...styleConfig.styles.explorerActionsStyle,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderTop: "1px solid rgb(214, 214, 214)",
            }}
            onSubmit={(event) => event.preventDefault()}
          >
            <span
              style={{
                display: "inline-block",
                flexGrow: "0",
                textAlign: "right",
              }}
            >
              Add new{" "}
            </span>
            <select
              onChange={(event) =>
                this._setAddOperationType(event.target.value)
              }
              value={this.state.newOperationType}
              style={{ flexGrow: "2" }}
            >
              {actionsOptions}
            </select>
            <button
              type="submit"
              className="toolbar-button"
              onClick={() =>
                this.state.newOperationType
                  ? addOperation(this.state.newOperationType)
                  : null
              }
              style={{
                ...styleConfig.styles.buttonStyle,
                height: "22px",
                width: "22px",
              }}
            >
              <span>+</span>
            </button>
          </form>
        </div>
      );

    const attribution = this.props.showAttribution ? <Attribution /> : null;

    return (
      <div
        ref={(ref) => {
          this._ref = ref;
        }}
        style={{
          fontSize: 12,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
          padding: 8,
          fontFamily:
            'Consolas, Inconsolata, "Droid Sans Mono", Monaco, monospace',
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        className="graphiql-explorer-root"
      >
        <div
          style={{
            flexGrow: "1",
            overflow: "scroll",
          }}
        >
          {relevantOperations.map(
            (
              operation: OperationDefinitionNode | FragmentDefinitionNode,
              index
            ) => {
              const operationName =
                operation && operation.name && operation.name.value;

              const operationKind =
                operation.kind === "FragmentDefinition"
                  ? "fragment"
                  : (operation && operation.operation) || "query";

              const onOperationRename = (newName) => {
                const newOperationDef = renameOperation(operation, newName);
                this.props.onEdit(print(newOperationDef));
              };

              const fragmentType =
                operation.kind === "FragmentDefinition" &&
                operation.typeCondition.kind === "NamedType" &&
                schema.getType(operation.typeCondition.name.value);

              const fragmentFields =
                fragmentType instanceof GraphQLObjectType
                  ? fragmentType.getFields()
                  : null;

              const fields =
                operationKind === "query"
                  ? queryFields
                  : operationKind === "mutation"
                  ? mutationFields
                  : operationKind === "subscription"
                  ? subscriptionFields
                  : operation.kind === "FragmentDefinition"
                  ? fragmentFields
                  : null;

              const fragmentTypeName =
                operation.kind === "FragmentDefinition"
                  ? operation.typeCondition.name.value
                  : null;

              return (
                <RootView
                  key={index}
                  isLast={index === relevantOperations.length - 1}
                  fields={fields}
                  operation={operationKind}
                  name={operationName}
                  definition={operation}
                  onOperationRename={onOperationRename}
                  onTypeName={fragmentTypeName}
                  onMount={this._handleRootViewMount}
                  onEdit={(newDefinition) => {
                    const newQuery = {
                      ...parsedQuery,
                      definitions: parsedQuery.definitions.map(
                        (existingDefinition) =>
                          existingDefinition === operation
                            ? newDefinition
                            : existingDefinition
                      ),
                    };

                    const textualNewQuery = print(newQuery);

                    this.props.onEdit(textualNewQuery);
                  }}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={getDefaultScalarArgValue}
                  makeDefaultArg={makeDefaultArg}
                  onRunOperation={() => {
                    if (!!this.props.onRunOperation) {
                      this.props.onRunOperation(operationName);
                    }
                  }}
                  styleConfig={styleConfig}
                />
              );
            }
          )}
          {/* {attribution} */}
        </div>

        {/* {actionsEl} */}
      </div>
    );
  }
}

// class ExplorerWrapper extends React.PureComponent<Props, {}> {
//   static defaultValue = defaultValue;
//   static defaultProps = {
//     width: 320,
//     title: 'Explorer',
//   };

//   render() {
//     return (

//     );
//   }
// }

function GraphQLBuilder({ schema, query, makeDefaultArg }) {
  if (!schema) {
    return <div>No Schema Available</div>;
  }
}

import { getIntrospectionQuery, buildSchema } from "graphql";

const schema = buildSchema(`
  type Query {
    getIdByName(id: String): String
  }
`);
