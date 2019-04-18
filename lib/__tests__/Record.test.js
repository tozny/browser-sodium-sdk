import { default as Meta } from '../types/meta'
import { default as Record } from '../types/record'
import { default as RecordData } from '../types/recordData'

describe('Record', () => {
  it('accepts raw object for data', async () => {
    let meta = await Meta.decode({
      record_id: '1234',
      writer_id: '1234',
      user_id: '1234',
      type: 'misc',
      plain: {},
      created: 1509557668,
      last_modified: 1509557668,
      version: '1222'
    })

    let data = {
      field: 'value',
      second: 'value'
    }

    let record = new Record(meta, data)

    expect(record.meta.recordId).toBe(meta.recordId)
    expect(record.data.field).toBe(data.field)
  })

  it('accepts instance object for data', async () => {
    let meta = await Meta.decode({
      record_id: '9999',
      writer_id: '1234',
      user_id: '1234',
      type: 'misc',
      plain: {},
      created: 1509557668,
      last_modified: 1509557668,
      version: '1222'
    })

    let data = new RecordData({
      field: 'value',
      second: 'value'
    })

    let record = new Record(meta, data)

    expect(record.meta.recordId).toBe(meta.recordId)
    expect(record.data.field).toBe(data.field)
  })

  it('throws with invalid data', async () => {
    let meta = await Meta.decode({
      record_id: '1234',
      writer_id: '1234',
      user_id: '1234',
      type: 'misc',
      plain: {},
      created: 1509557668,
      last_modified: 1509557668,
      version: '1222'
    })

    expect(() => {
      new Record(meta, 'data')
    }).toThrow()
  })
})