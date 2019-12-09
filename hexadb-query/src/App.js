import React from 'react';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';
import FormLabel from 'react-bootstrap/FormLabel';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Collapse from 'react-bootstrap/Collapse';
import {Typeahead} from 'react-bootstrap-typeahead';
import logo from './logo.svg';
import ReactJson from 'react-json-view'
import './App.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

function App() {
  const [predicates, setPredicates] = React.useState(['type', 'temp', 'humidity', 'color']);
  const [operations, setOperations] = React.useState(['eq', 'ge', 'gt', 'le', 'lt', 'ne']);
  const [hostUrl, setHostUrl] = React.useState(localStorage.getItem('hostUrl') || '');
  const [storeId, setStoreId] = React.useState(localStorage.getItem('storeId') || '');
  const [filters, setFilters] = React.useState([
    {
      index: 0,
      predicate: '',
      operation: '',
      value: ''
    }
  ]);
  const [outgoings, setOutgoings] = React.useState([
    {
      index: 0,
      path: '*',
      level: 0,
      target: {
        filters: [
          {
            index: 0,
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }
  ]);
  const [jsonResponse, setJsonResponse] = React.useState('No Result');
  const [showJson, setShowJson] = React.useState(false);
  const [showTable, setShowTable] = React.useState(false);
  const [showConnectionInfo, setShowConnectionInfo] = React.useState(true);
  const [showFilters, setShowFilters] = React.useState(true);
  const [showOutgoing, setShowOutgoing] = React.useState(false);
  const [showIncoming, setShowIncoming] = React.useState(false);
  const [values, setValues] = React.useState([]);
 
  function renderFilters() {
    var filterGroups = [];
    for(var filter of filters) {
      filterGroups.push(<InputGroup className="input-group">
      <Typeahead
          labelKey="predicate"
          multiple={false}
          options={predicates}
          placeholder="Choose a predicate"
          className="Typeahead"
          value={filter.predicate}
          allowNew={true}
          onChange={(selected) => setFilters(filters.map(f => f.index === filter.index ? {...f, predicate: selected.length && selected[0]} : f))}
          onInputChange={(val) => setFilters(filters.map(f => f.index === filter.index ? {...f, predicate: val} : f))}
        />
        <Typeahead
          labelKey="operation"
          multiple={false}
          options={operations}
          placeholder="Choose an operation"
          className="Typeahead"
          value={filter.operation}
          onChange={(selected) => setFilters(filters.map(f => f.index === filter.index ? {...f, operation: selected.length && selected[0]} : f))}
          onInputChange={(val) => setFilters(filters.map(f => f.index === filter.index ? {...f, operation: val} : f))}
        ></Typeahead>
        <FormControl
          placeholder="value"
          aria-label="value"
          value={filter.value}
          onChange={(e) => setFilters(filters.map(f => f.index === filter.index ? {...f, value: e.target && e.target.value} : f))}
        />
    </InputGroup>)
    }
    return <>
    {filterGroups}
    </>;
  }

  function renderOutgoings() {
    var outgoingGroups = [];
    for(var outgoing of outgoings) {
      var filterGroups = [];
      if (!outgoing.target) continue;
      for(var filter of outgoing.target.filters) {
        filterGroups.push(<InputGroup className="input-group">
          <Typeahead
              labelKey="predicate"
              multiple={false}
              options={predicates}
              placeholder="Choose a predicate"
              className="Typeahead"
              value={filter.predicate}
              allowNew={true}
              onChange={(selected) => setOutgoings(outgoings.map(o => o.index === outgoing.index
                ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.index === filter.index 
                  ? {...f, predicate: selected.length && selected[0]}
                  : f) }} 
                : o))}
              onInputChange={(val) => setOutgoings(outgoings.map(o => o.index === outgoing.index
                ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.index === filter.index 
                  ? {...f, predicate: val}
                  : f) }}
                : o))}
            />
            <Typeahead
              labelKey="operation"
              multiple={false}
              options={operations}
              placeholder="Choose an operation"
              className="Typeahead"
              value={filter.operation}
              onChange={(selected) => setOutgoings(outgoings.map(o => o.index === outgoing.index
                ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.index === filter.index 
                  ? {...f, operation: selected.length && selected[0]}
                  : f) }} 
                : o))}
              onInputChange={(val) => setOutgoings(outgoings.map(o => o.index === outgoing.index
                ? {...o, target: {...o.target, filters: o.target.filters.map(f => f.index === filter.index 
                  ? {...f, operation: val}
                  : f) }}
                : o))}
            ></Typeahead>
            <FormControl
              placeholder="value"
              aria-label="value"
              value={filter.value}
              onChange={(e) => setOutgoings(outgoings.map(o => o.index === outgoing.index
                ?  {...o, target: {...o.target, filters: o.target.filters.map(f => f.index === filter.index 
                  ? {...f, value: e.target && e.target.value}
                  : f) }}
                : o))}
            />
          </InputGroup>);
      }
      outgoingGroups.push(<div className="section">
      <Form.Label>
        Path
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="path"
        aria-label="path"
        value={outgoing.path}
        onChange={(e) => setOutgoings(outgoings.map(o => o.index === outgoing.index ? {...o, path: e.target && e.target.value} : o))}
      />
      <Form.Label>
        Level
      </Form.Label>
      <Form.Control
        className="path-input"
        placeholder="level"
        aria-label="level"
        value={outgoing.level}
        onChange={(e) => setOutgoings(outgoings.map(o => o.index === outgoing.index ? {...o, level: e.target && e.target.value} : o))}
      />
      <Form.Label>
        Filters:
      </Form.Label>
      {filterGroups}
      <div className="action-button">
            <Button variant="info" onClick={() => addOutgoingFilter(outgoing.index)}>Add Filter</Button>
        </div>
      </div>);
    }
    return <>
    {outgoingGroups}
    </>;
  }

  function addFilter(){
    setFilters([...filters, {
      index: filters.length,
      predicate: '',
      operation: '',
      value: ''
    }]);
  }

  function addOutgoing(){
    setOutgoings([...outgoings, {
      index: outgoings.length,
      path: '*',
      target: {
        filters: [
          {
            index: 0,
            predicate: '',
            operation: '',
            value: ''
          }
        ] 
      }
    }]);
  }

  function addOutgoingFilter(index){
    var updatedOutgoing = outgoings.filter(o => o.index === index)[0];
    updatedOutgoing.target.filters = [...updatedOutgoing.target.filters, {
      index: updatedOutgoing.target.filters.length,
      predicate: '',
      operation: '',
      value: ''
    }];
    setOutgoings(outgoings.map(o => o.index === index ? updatedOutgoing : o));
  }

  async function setConnection() {
    console.log(hostUrl);
    const response =
      await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/predicates`);
    console.log(response.data);
    setPredicates(response.data.values);
    localStorage.setItem('hostUrl', hostUrl);
    localStorage.setItem('storeId', storeId);
  }

  function anyValidOutgoings() {
    for(var outgoing of outgoings) {
      if(outgoing.target && outgoing.target.filters && outgoing.target.filters.some((filter) => filter.predicate && filter.operation && filter.value)) return true;
    }
    return false;
  }

  function tryParseInt(str,defaultValue = 0) {
    var retValue = defaultValue;
    if(str) {
      if (!isNaN(str)) {
          retValue = parseInt(str);
      }
    }
    return retValue;
  }


  function createTableHeader(allProperties) {
    var ths = [];
    ths.push(<th>#</th>);
    for(var headerValue of allProperties){
      ths.push(<th>{headerValue}</th>)
    }
    return <thead><tr>{ths}</tr></thead>;
  }

  function createTableBody(values, allProperties) {
    var trs = [];
    var count = 1;
    for(var value of values) {
      var tds = []
      tds.push(<td>{count++}</td>);
      for(var property of allProperties) {
        tds.push(<td>{value[property]}</td>);
      }
      trs.push(<tr>{tds}</tr>);
    }
    return (<tbody>{trs}</tbody>);
  }

  function createTable() {
    var set = new Set();
    for(var value of values) {
      for(var property in value) {
        set.add(property);
      }
    }
    return (<Table striped bordered hover variant="dark">{createTableHeader(set)}{createTableBody(values, set)}</Table>);
  }

 

  async function runQuery() {
    console.log(filters);
    console.log(outgoings);
    var body = { filter: {}};
    for(var filter of filters){
      body.filter[filter.predicate] = { 
        op: filter.operation,
        value: filter.value
      }
      // convert strings to bools
      if (body.filter[filter.predicate].value === "true") {
        body.filter[filter.predicate].value = true;
      }
      if (body.filter[filter.predicate].value === "false") {
        body.filter[filter.predicate].value = false;
      }
    }

    // TODO: better check for existance of valid outgoings
    if (anyValidOutgoings()){
      body.outgoing = [];
      for(var outgoing of outgoings) {
        var newOutgoing = {
          path: outgoing.path,
          level: outgoing.level,
          target: {
            filter: {}
          }
        };
        for(var filter of outgoing.target.filters) {
          newOutgoing.target.filter[filter.predicate] = { 
            op: filter.operation,
            value: filter.value
          }
          // convert strings to bools
          if (newOutgoing.target.filter[filter.predicate].value === "true") {
            newOutgoing.target.filter[filter.predicate].value = true;
          }
          if (newOutgoing.target.filter[filter.predicate].value === "false") {
            newOutgoing.target.filter[filter.predicate].value = false;
          }
          newOutgoing.level = tryParseInt(newOutgoing.level);
        }
        body.outgoing.push(newOutgoing)
      }
    }
    
    console.log(body);
    const response =
      await axios.post(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/query`, body);
    console.log(response);
    setJsonResponse(JSON.stringify(response.data, null, 2));
    setJsonResponse(response.data);
    setShowJson(true);
    // setValues(response.data.values);
  }

  async function nodeSelected(selected) {
    console.log(selected);
    if(selected.name === 'id') {
      var nodeToUpdate = jsonResponse;
      for(var i of selected.namespace){
        nodeToUpdate = nodeToUpdate[i];
      }
      const response = await axios.get(`${hostUrl}/api/store/${encodeURIComponent(storeId)}/${encodeURIComponent(selected.value)}`);
      console.log(response);
      nodeToUpdate = {...nodeToUpdate, ...response.data};
      for(var i = selected.namespace.length - 1; i >= 0; i--){
        var parentNode = jsonResponse;
        for(var j = 0; j < i; j++){
          parentNode = parentNode[selected.namespace[j]];
        }
        parentNode[selected.namespace[i]] = nodeToUpdate;
        nodeToUpdate = parentNode;
      }
      setJsonResponse(JSON.parse(JSON.stringify(nodeToUpdate)));
    }
  }

  return (
    <div className="App">
      <Jumbotron>
        <h1>
          HexDb Query Builder
        </h1>
      </Jumbotron>
      <div className="connection-info">
        <h5 className="section-title" onClick={() => setShowConnectionInfo(!showConnectionInfo)}>
          Connection Info
        </h5>
          <Form className="section">
            <Form.Group controlId="formBasicEmail">
              <Form.Label>Host Url</Form.Label>
              <Form.Control type="text" placeholder="https://YourHost:YourPort" value={hostUrl} onChange={(e) => setHostUrl(e.target.value)}/>
              <Form.Label>Store Id</Form.Label>
              <Form.Control type="text" placeholder="abc123" value={storeId} onChange={(e) => setStoreId(e.target.value)}/>
            </Form.Group>
          </Form>
          <div className="action-button">
            <Button variant="info" onClick={setConnection}>Set Connection</Button>
          </div>
      </div>
      <hr/>
      <h5 className="section-title" onClick={() => setShowFilters(!showFilters)}>
        Filters
      </h5>
        {renderFilters()}
        <div className="action-button">
            <Button variant="info" onClick={addFilter}>Add Filter</Button>
        </div>
      <h5 className="section-title" onClick={() => setShowOutgoing(!showOutgoing)}>
        Outgoing
      </h5>
        {renderOutgoings()}
        <div className="action-button">
            <Button variant="info" onClick={addOutgoing}>Add Outgoing</Button>
        </div>
      <hr/>
      <div className="action-button">
        <Button variant="primary" onClick={runQuery}>Run Query</Button>
      </div>
      <hr/>
      <div>
        <h5 className="section-title" onClick={() => setShowJson(!showJson)}>
          Query Response JSON
        </h5>
        <Collapse in={showJson}>
          <div className="section query-response">
            <ReactJson src={jsonResponse} onSelect={nodeSelected}></ReactJson>
            {/* <pre>{jsonResponse}</pre> */}
          </div>
        </Collapse>
      </div>
      <hr/>
    </div>
  );
}



export default App;

// TODO: basic header, input for url for hexastore, input newline button, submit button, autocomplete, input for each filter, add outgoing and incoming sections, table/json result section
